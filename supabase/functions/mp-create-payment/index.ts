// Crea una preferencia de Mercado Pago Checkout Pro (solo PSE) para un pedido
// existente y devuelve la URL de la página de pago de Mercado Pago.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Checkout Pro no permite "incluir solo PSE"; se excluye todo lo demás.
const EXCLUDED_PAYMENT_TYPES = ['credit_card', 'debit_card', 'ticket', 'atm', 'prepaid_card'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get('MP_TEST_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MP_TEST_ACCESS_TOKEN no está configurado en los secrets de Supabase');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No autenticado');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) throw new Error('Sesión inválida o expirada');
    const user = userData.user;

    const { order_id, return_to } = (await req.json()) ?? {};
    if (!order_id) throw new Error('Falta el pedido a pagar');

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).single();
    if (orderError || !order) throw new Error('Pedido no encontrado');
    if (order.user_id !== user.id) throw new Error('Este pedido no te pertenece');
    if (order.status !== 'pendiente_pago') throw new Error('Este pedido ya no admite un nuevo intento de pago');

    // El total se recalcula con los precios de la base de datos, no con los que envió la app.
    const { data: orderItems } = await admin
      .from('order_items')
      .select('product_id, product_name, quantity, products(price)')
      .eq('order_id', order_id);
    if (!orderItems?.length) throw new Error('El pedido no tiene productos');

    const items = orderItems.map((i: any) => {
      const price = Number(i.products?.price);
      if (!i.product_id || !Number.isFinite(price)) throw new Error(`El producto "${i.product_name}" ya no está disponible`);
      return { title: i.product_name, quantity: i.quantity, unit_price: Math.round(price), currency_id: 'COP' };
    });
    const total = items.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0);
    if (total !== Number(order.total)) {
      await admin.from('orders').update({ total }).eq('id', order_id);
    }

    const returnUrl =
      `${supabaseUrl}/functions/v1/mp-return` + (return_to ? `?redirect=${encodeURIComponent(return_to)}` : '');

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        items,
        external_reference: order_id,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
        back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
        auto_return: 'approved',
        statement_descriptor: 'YESSMER',
        payment_methods: {
          excluded_payment_types: EXCLUDED_PAYMENT_TYPES.map((id) => ({ id })),
        },
      }),
    });
    const mpJson = await mpRes.json();
    if (!mpRes.ok || !mpJson.init_point) {
      console.error('Mercado Pago rechazó la preferencia:', JSON.stringify(mpJson));
      throw new Error(mpJson?.message || 'Mercado Pago no pudo crear el pago');
    }

    await admin
      .from('orders')
      .update({ payment_method: 'mercadopago_pse', mp_status: 'checkout_created', mp_status_detail: null })
      .eq('id', order_id);

    return new Response(JSON.stringify({ redirect_url: mpJson.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

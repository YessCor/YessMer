// Crea una orden de pago PSE en Mercado Pago (Checkout API Orders, POST /v1/orders)
// para un pedido existente y devuelve la URL a la que hay que redirigir al
// cliente para autenticarse con su banco.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function findUrl(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== 'object') return null;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (keys.includes(k) && typeof v === 'string' && v.startsWith('http')) return v;
    const nested = findUrl(v, keys);
    if (nested) return nested;
  }
  return null;
}

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

    const body = await req.json();
    const { order_id, payer } = body ?? {};
    if (!order_id || !payer) throw new Error('Faltan datos del pedido o del pagador');
    const {
      email, firstName, lastName, docType, docNumber, entityType, financialInstitution,
      phone, city, neighborhood, zipCode,
    } = payer;
    if (
      !email || !firstName || !lastName || !docType || !docNumber || !entityType || !financialInstitution ||
      !phone || !city || !neighborhood || !zipCode
    ) {
      throw new Error('Completa todos los datos del pagador para continuar con PSE');
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();
    if (orderError || !order) throw new Error('Pedido no encontrado');
    if (order.user_id !== user.id) throw new Error('Este pedido no te pertenece');
    if (order.status !== 'pendiente_pago') throw new Error('Este pedido ya no admite un nuevo intento de pago');

    const returnUrl = `${supabaseUrl}/functions/v1/mp-return`;
    // COP no maneja centavos: Mercado Pago exige el monto como entero en string.
    const amount = String(Math.round(Number(order.total)));

    let phoneDigits = String(phone).replace(/\D/g, '');
    if (phoneDigits.length > 10 && phoneDigits.startsWith('57')) phoneDigits = phoneDigits.slice(2);

    const street = String(order.shipping_address ?? '').trim();
    const streetNumber = street.match(/\d+/)?.[0] ?? '0';

    const payerIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    const mpRes = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': `${order_id}-${Date.now()}`,
      },
      body: JSON.stringify({
        type: 'online',
        total_amount: amount,
        external_reference: order_id,
        processing_mode: 'automatic',
        expiration_time: 'PT20M',
        payer: {
          email,
          entity_type: entityType, // 'individual' | 'association'
          identification: { type: docType, number: docNumber },
          first_name: firstName,
          last_name: lastName,
          phone: { area_code: '57', number: phoneDigits },
          address: {
            street_name: street || 'Sin dirección',
            street_number: streetNumber,
            city,
            zip_code: zipCode,
            neighborhood,
          },
        },
        additional_info: {
          'payer.ip_address': payerIp,
        },
        transactions: {
          payments: [
            {
              amount,
              payment_method: {
                id: 'pse',
                type: 'bank_transfer',
                financial_institution: financialInstitution,
              },
            },
          ],
        },
        config: {
          online: {
            callback_url: returnUrl,
          },
        },
      }),
    });
    const mpJson = await mpRes.json();
    if (!mpRes.ok) {
      console.error('Mercado Pago rechazó /v1/orders:', JSON.stringify(mpJson));
      const detail =
        mpJson?.cause?.[0]?.description ||
        mpJson?.message ||
        mpJson?.error ||
        JSON.stringify(mpJson);
      throw new Error(detail);
    }

    // La orden se procesa de forma asíncrona (status "processing"); el enlace al banco
    // aparece cuando pasa a "action_required", así que se consulta hasta que esté.
    let mpOrder = mpJson;
    let redirectUrl = findUrl(mpOrder, ['redirect_url', 'ticket_url', 'external_resource_url']);
    for (let attempt = 0; !redirectUrl && attempt < 15; attempt++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.mercadopago.com/v1/orders/${mpJson.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!pollRes.ok) continue;
      mpOrder = await pollRes.json();
      if (mpOrder.status === 'failed' || mpOrder.status === 'canceled' || mpOrder.status === 'cancelled') break;
      redirectUrl = findUrl(mpOrder, ['redirect_url', 'ticket_url', 'external_resource_url']);
    }
    if (!redirectUrl) {
      console.error('Orden de Mercado Pago sin enlace PSE:', JSON.stringify(mpOrder));
      const payment = mpOrder?.transactions?.payments?.[0];
      throw new Error(
        `Mercado Pago no devolvió el enlace de autenticación PSE (estado: ${mpOrder.status}/${payment?.status_detail ?? mpOrder.status_detail}). Intenta de nuevo en unos segundos.`
      );
    }

    await admin
      .from('orders')
      .update({
        payment_method: 'mercadopago_pse',
        mp_payment_id: mpOrder.id,
        mp_status: mpOrder.status,
        mp_status_detail: mpOrder.status_detail,
      })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({ payment_id: mpOrder.id, status: mpOrder.status, redirect_url: redirectUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

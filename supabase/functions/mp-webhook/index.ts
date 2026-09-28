// Webhook de Mercado Pago. La URL se envía en cada preferencia (notification_url),
// así que no depende de la configuración de webhooks del panel.
//
// Mercado Pago solo avisa que "algo cambió"; siempre se vuelve a consultar el pago
// por su id para confirmar el estado real antes de actualizar el pedido.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PAYMENT_STATUS_MAP: Record<string, string> = {
  approved: 'confirmado',
  authorized: 'pago_reportado',
  pending: 'pago_reportado',
  in_process: 'pago_reportado',
  in_mediation: 'pago_reportado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'rechazado',
  charged_back: 'rechazado',
};

const FINAL_STATUSES = ['confirmado', 'enviado'];

Deno.serve(async (req) => {
  // Siempre se responde 200 para que Mercado Pago no reintente indefinidamente.
  try {
    const url = new URL(req.url);
    let topic = url.searchParams.get('type') || url.searchParams.get('topic');
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (req.method === 'POST') {
      const body = await req.json().catch(() => null);
      topic = body?.type ?? body?.topic ?? topic;
      paymentId = body?.data?.id ? String(body.data.id) : paymentId;
    }

    if (topic !== 'payment' || !paymentId) return new Response('ignored', { status: 200 });

    const accessToken = Deno.env.get('MP_TEST_ACCESS_TOKEN');
    if (!accessToken) return new Response('MP_TEST_ACCESS_TOKEN missing', { status: 200 });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpRes.ok) return new Response('could not fetch payment', { status: 200 });
    const payment = await mpRes.json();

    const orderId = payment.external_reference;
    if (!orderId) return new Response('no external_reference', { status: 200 });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single();
    if (!order) return new Response('order not found', { status: 200 });

    // Un pedido ya confirmado no se revierte por notificaciones tardías de otros intentos.
    if (FINAL_STATUSES.includes(order.status)) return new Response('already final', { status: 200 });

    let newStatus = PAYMENT_STATUS_MAP[payment.status] ?? order.status;
    // Un pago aprobado por menos del total queda para revisión manual del admin.
    if (newStatus === 'confirmado' && Number(payment.transaction_amount) < Number(order.total)) {
      newStatus = 'pago_reportado';
    }

    await admin
      .from('orders')
      .update({
        status: newStatus,
        mp_payment_id: String(payment.id),
        mp_status: payment.status,
        mp_status_detail: payment.status_detail,
      })
      .eq('id', orderId);

    // Igual que cuando el admin confirma un pago manual: descuenta stock una sola vez.
    if (newStatus === 'confirmado') {
      const { data: items } = await admin.from('order_items').select('*').eq('order_id', orderId);
      for (const item of items ?? []) {
        if (!item.product_id) continue;
        const { data: prod } = await admin.from('products').select('stock').eq('id', item.product_id).single();
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await admin.from('products').update({ stock: newStock }).eq('id', item.product_id);
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response('error: ' + (e instanceof Error ? e.message : String(e)), { status: 200 });
  }
});

// Webhook de Mercado Pago (Checkout API Orders). Configúralo en:
//   Mercado Pago > Tu integración > Webhooks
//   URL: https://TU-PROYECTO.supabase.co/functions/v1/mp-webhook
//   Eventos: Pagos / Orders
//
// Mercado Pago solo nos avisa que "algo cambió"; siempre volvemos a consultar
// la orden por su id (GET /v1/orders/{id}) para confirmar el estado real
// antes de actualizar el pedido.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// El estado del pago dentro de transactions.payments[0] es más específico
// que el de la orden; se usa primero cuando está disponible.
const PAYMENT_STATUS_MAP: Record<string, string> = {
  approved: 'confirmado',
  accredited: 'confirmado',
  rejected: 'rechazado',
  failed: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'rechazado',
  charged_back: 'rechazado',
  pending: 'pago_reportado',
  in_process: 'pago_reportado',
  action_required: 'pago_reportado',
};

const ORDER_STATUS_MAP: Record<string, string> = {
  processed: 'confirmado',
  failed: 'rechazado',
  cancelled: 'cancelado',
  expired: 'rechazado',
  action_required: 'pago_reportado',
  created: 'pago_reportado',
};

Deno.serve(async (req) => {
  // Siempre respondemos 200 salvo error propio, para que Mercado Pago no reintente indefinidamente.
  try {
    let mpOrderId: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => null);
      if (body?.type === 'order' || body?.action?.startsWith?.('order.')) {
        mpOrderId = body?.data?.id ? String(body.data.id) : null;
      }
    }

    if (!mpOrderId) {
      const url = new URL(req.url);
      mpOrderId = url.searchParams.get('data.id') || url.searchParams.get('id');
    }

    if (!mpOrderId) return new Response('ignored', { status: 200 });

    const accessToken = Deno.env.get('MP_TEST_ACCESS_TOKEN');
    if (!accessToken) return new Response('MP_TEST_ACCESS_TOKEN missing', { status: 200 });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/orders/${mpOrderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpRes.ok) return new Response('could not fetch order', { status: 200 });
    const mpOrder = await mpRes.json();

    const orderId = mpOrder.external_reference;
    if (!orderId) return new Response('no external_reference', { status: 200 });

    const payment = mpOrder?.transactions?.payments?.[0];
    const newStatus =
      (payment?.status && PAYMENT_STATUS_MAP[payment.status]) ||
      ORDER_STATUS_MAP[mpOrder.status] ||
      null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single();
    if (!order) return new Response('order not found', { status: 200 });

    const finalStatus = newStatus ?? order.status;
    const wasAlreadyConfirmed = order.status === 'confirmado';

    await admin
      .from('orders')
      .update({
        status: finalStatus,
        mp_payment_id: mpOrder.id,
        mp_status: payment?.status ?? mpOrder.status,
        mp_status_detail: payment?.status_detail ?? mpOrder.status_detail,
      })
      .eq('id', orderId);

    // Igual que cuando el admin confirma un pago manual: descuenta stock una sola vez.
    if (finalStatus === 'confirmado' && !wasAlreadyConfirmed) {
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

import { supabase } from './supabase';

// Crea el pago en Mercado Pago Checkout Pro (PSE) y devuelve la URL de su página de pago.
// returnTo es la URL de la app a la que Mercado Pago devuelve al cliente al terminar.
export async function createPsePayment(orderId: string, returnTo: string): Promise<{ redirect_url: string }> {
  const { data, error } = await supabase.functions.invoke('mp-create-payment', {
    body: { order_id: orderId, return_to: returnTo },
  });
  if (data?.error) throw new Error(data.error);
  if (error) {
    // En errores HTTP, supabase-js deja el cuerpo JSON en error.context.
    const body = await (error as any).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message ?? 'No se pudo iniciar el pago con PSE');
  }
  return data;
}

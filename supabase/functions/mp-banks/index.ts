// Devuelve el listado de bancos disponibles para pagos PSE en Mercado Pago Colombia.
// Requiere el secret MP_TEST_ACCESS_TOKEN configurado en el proyecto de Supabase:
//   supabase secrets set MP_TEST_ACCESS_TOKEN=TU_ACCESS_TOKEN
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get('MP_TEST_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MP_TEST_ACCESS_TOKEN no está configurado en los secrets de Supabase');

    const res = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message ?? 'No se pudo obtener el listado de métodos de pago desde Mercado Pago');
    }

    const pse = (Array.isArray(json) ? json : []).find((m: any) => m.id === 'pse');
    const banks = (pse?.financial_institutions ?? []).map((b: any) => ({
      id: String(b.id),
      description: String(b.description),
    }));

    return new Response(JSON.stringify({ banks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

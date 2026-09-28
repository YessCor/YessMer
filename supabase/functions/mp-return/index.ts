// Página a la que Mercado Pago redirige al cliente luego de autenticarse
// con su banco en el flujo PSE (parámetro callback_url del pago).
// El estado real del pedido lo actualiza mp-webhook; esta página solo
// le indica al usuario que vuelva a la app.
Deno.serve(() => {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pago procesado - Yessmer</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #F6F7FB; display: flex;
      align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 420px; text-align: center;
      box-shadow: 0 2px 10px rgba(17,24,39,0.08); }
    h1 { color: #111827; font-size: 20px; margin: 0 0 8px; }
    p { color: #6B7280; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>¡Listo!</h1>
    <p>Ya puedes cerrar esta ventana y volver a la app Yessmer para ver el estado de tu pedido.</p>
  </div>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
});

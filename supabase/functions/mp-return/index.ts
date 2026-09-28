// Página a la que Mercado Pago devuelve al cliente después de pagar (back_urls).
// El estado real del pedido lo actualiza mp-webhook; esta página solo informa
// y, si recibe ?redirect=, lleva al cliente de vuelta a su pedido en la app.

// Solo se redirige a la app (esquemas nativos / Expo Go) o a la web local,
// para no convertir esta página en un redireccionador abierto.
function isAllowedRedirect(url: string): boolean {
  if (/^(yessmer|exps?):\/\//.test(url)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) return true;
  const appWebUrl = Deno.env.get('APP_WEB_URL');
  return !!appWebUrl && url.startsWith(appWebUrl.replace(/\/?$/, '/'));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const MESSAGES: Record<string, [string, string]> = {
  approved: ['¡Pago aprobado!', 'Tu pedido quedó confirmado.'],
  pending: ['Pago en proceso', 'Tu banco está confirmando el pago. Te avisaremos en la app cuando se apruebe.'],
  in_process: ['Pago en proceso', 'Tu banco está confirmando el pago. Te avisaremos en la app cuando se apruebe.'],
  rejected: ['El pago no se completó', 'Puedes intentarlo de nuevo desde la app.'],
};

Deno.serve((req) => {
  const params = new URL(req.url).searchParams;
  const status = params.get('collection_status') || params.get('status') || '';
  const [title, text] = MESSAGES[status] ?? ['¡Listo!', 'Vuelve a la app Yessmer para ver el estado de tu pedido.'];

  const redirect = params.get('redirect');
  const target = redirect && isAllowedRedirect(redirect) ? redirect : null;

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pago - Yessmer</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #F6F7FB; display: flex;
      align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 420px; text-align: center;
      box-shadow: 0 2px 10px rgba(17,24,39,0.08); }
    h1 { color: #111827; font-size: 20px; margin: 0 0 8px; }
    p { color: #6B7280; font-size: 14px; margin: 0 0 20px; }
    a { display: inline-block; background: #FF8A00; color: #fff; text-decoration: none; font-weight: 700;
      padding: 12px 20px; border-radius: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(text)}</p>
    ${target ? `<a href="${escapeHtml(target)}">Volver a Yessmer</a>` : ''}
  </div>
  ${target ? `<script>setTimeout(function () { location.replace(${JSON.stringify(target).replace(/</g, '\\u003c')}); }, 1500);</script>` : ''}
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
});

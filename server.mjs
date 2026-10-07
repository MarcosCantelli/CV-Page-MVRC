// Production server: wraps the @astrojs/node standalone handler to add security
// headers to every response (static files included) and expose /healthz.
import http from 'node:http';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

const port = Number(process.env.PORT ?? 4321);
const host = process.env.HOST ?? '0.0.0.0';
const hsts = process.env.HSTS !== 'false';

// script-src/style-src (with hashes) come from Astro's CSP feature (astro.config.mjs).
// These directives cannot be set through <meta> so they are sent as a header.
const securityHeaders = {
  'Content-Security-Policy':
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  ...(hsts && { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }),
};

const server = http.createServer((req, res) => {
  for (const [key, value] of Object.entries(securityHeaders)) res.setHeader(key, value);

  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end('{"status":"ok"}');
    return;
  }
  handler(req, res);
});

server.listen(port, host, () => console.log(`Server listening on http://${host}:${port}`));

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}

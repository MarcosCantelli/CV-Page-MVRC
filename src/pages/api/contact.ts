import type { APIRoute } from 'astro';
import { HONEYPOT_FIELD, contactSchema, type ContactErrorCode } from '../../lib/contact-schema';
import { getMailer } from '../../lib/mail';
import { clientIp, isRateLimited, reserveGlobalSend } from '../../lib/rate-limit';
import { verifyTurnstile } from '../../lib/turnstile';
import * as z from 'zod/mini';

export const prerender = false;

const json = (status: number, body: { ok: boolean; errors?: ContactErrorCode[] }) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Exact media type check: "text/plain; x=application/json" must not pass (CSRF via simple requests).
  const mediaType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    return json(415, { ok: false, errors: ['server'] });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload))
      throw new Error('not an object');
  } catch {
    return json(400, { ok: false, errors: ['server'] });
  }

  // Honeypot: pretend success so bots do not retry.
  if (typeof payload[HONEYPOT_FIELD] === 'string' && payload[HONEYPOT_FIELD] !== '') {
    return json(200, { ok: true });
  }

  const ip = clientIp(request, clientAddress);
  if (isRateLimited(ip)) return json(429, { ok: false, errors: ['rate_limited'] });

  const parsed = z.safeParse(contactSchema, payload);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path[0]))] as ContactErrorCode[];
    return json(400, { ok: false, errors: fields });
  }

  const token = typeof payload['turnstileToken'] === 'string' ? payload['turnstileToken'] : '';
  if (!(await verifyTurnstile(token, ip))) return json(400, { ok: false, errors: ['captcha'] });

  // Global cap on e-mails actually sent (protects the Resend quota even if many IPs pass the checks).
  if (!reserveGlobalSend()) return json(429, { ok: false, errors: ['rate_limited'] });

  const { name, email, company, message } = parsed.data;
  const lang = payload['lang'] === 'en' ? 'en' : 'pt';
  const text = [
    `Nome/Name: ${name}`,
    `E-mail: ${email}`,
    `Empresa/Company: ${company || '-'}`,
    `Idioma/Language: ${lang}`,
    '',
    message,
  ].join('\n');

  try {
    await getMailer().send({
      subject: `[${new URL(import.meta.env.SITE).host}] Contato de ${name}${company ? ` (${company})` : ''}`,
      replyTo: email,
      text,
      html: `<pre style="font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
    });
  } catch (err) {
    console.error('[contact] failed to send', err);
    return json(502, { ok: false, errors: ['server'] });
  }

  return json(200, { ok: true });
};

export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });

import { TURNSTILE_SECRET_KEY } from 'astro:env/server';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Validates a Turnstile token server-side. */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not set');
    return false;
  }
  if (!token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) console.warn('[turnstile] rejected:', data['error-codes']);
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verification failed', err);
    return false;
  }
}

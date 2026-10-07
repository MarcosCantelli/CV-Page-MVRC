// In-memory sliding-window rate limit. Good enough for a single container;
// counters reset when the process restarts.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

// Drop stale entries so the map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of hits) {
    if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
}, WINDOW_MS).unref();

/**
 * Client IP. Behind Cloudflare (Tunnel or proxy) the real address is in
 * CF-Connecting-IP; otherwise fall back to X-Forwarded-For / socket address.
 */
export function clientIp(request: Request, fallback: string | undefined): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return fallback ?? 'unknown';
}

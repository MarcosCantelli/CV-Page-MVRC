import type { APIRoute } from 'astro';

// Only the production domain is indexable; other environments (dev server) are blocked.
export const GET: APIRoute = ({ site }) => {
  const production = site?.hostname === 'mvrc.com.br';
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const body = production
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL(`${base}/sitemap-index.xml`, site).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

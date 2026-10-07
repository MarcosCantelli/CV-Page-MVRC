// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Build-time settings. SITE_URL and BASE_PATH change between environments
// (production: https://mvrc.com.br at "/", dev server: http://dev.mvrc.local at "/cv").
const site = process.env.SITE_URL ?? 'https://mvrc.com.br';
const base = process.env.BASE_PATH ?? '/';

const turnstile = 'https://challenges.cloudflare.com';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  output: 'static',
  adapter: node({ mode: 'standalone', bodySizeLimit: 32 * 1024 }),
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'pt', locales: { pt: 'pt-BR', en: 'en-US' } },
    }),
  ],
  i18n: {
    locales: ['pt', 'en'],
    defaultLocale: 'pt',
    routing: { prefixDefaultLocale: false },
  },
  env: {
    schema: {
      // Public: baked into the static HTML at build time.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '1x00000000000000000000AA', // Cloudflare test key (always passes)
      }),
      // Secrets: read from process.env at runtime by the server.
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_DRIVER: envField.enum({
        context: 'server',
        access: 'secret',
        values: ['resend', 'log'],
        default: 'resend',
      }),
    },
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        `frame-src ${turnstile}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", turnstile] },
    },
  },
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
  },
});

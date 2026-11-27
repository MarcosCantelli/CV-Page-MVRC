import { defineConfig } from '@playwright/test';

// E2E runs against the production build served by server.mjs (`pnpm build` first; `pnpm test:e2e` does it).
// CHROME_BIN (optional) points to a Chromium binary already installed on the machine.
const port = Number(process.env['E2E_PORT'] ?? 4399);
const executablePath = process.env['CHROME_BIN'] || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-375', use: { viewport: { width: 375, height: 667 }, hasTouch: true } },
  ],
  webServer: {
    command: 'node server.mjs',
    url: `http://127.0.0.1:${port}/healthz`,
    env: { PORT: String(port), HOST: '127.0.0.1', HSTS: 'false' },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

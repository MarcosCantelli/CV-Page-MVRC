import { expect, test, type Page } from '@playwright/test';

// Pages that must carry the theme button. "/nao-existe-e2e" is served as the 404 page.
const pages = [
  { path: '/', name: 'pt', label: 'Tema escuro' },
  { path: '/en/', name: 'en', label: 'Dark theme' },
  { path: '/nao-existe-e2e', name: '404', label: 'Tema escuro' },
];

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset['theme']);
const toggle = (page: Page, label: string) => page.getByRole('button', { name: label });

for (const p of pages) {
  test.describe(`página ${p.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    });

    test('1. botão visível e dentro da viewport', async ({ page }) => {
      await page.goto(p.path);
      const button = toggle(page, p.label);
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      const viewport = page.viewportSize()!;
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      expect(box!.width).toBeGreaterThanOrEqual(36);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, 'sem rolagem horizontal').toBe(false);
    });

    test('2. clicar alterna sem recarregar', async ({ page }) => {
      await page.goto(p.path);
      await page.evaluate(() => ((window as unknown as { __marca: number }).__marca = 1));
      const button = toggle(page, p.label);
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await button.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await button.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      const marca = await page.evaluate(() => (window as unknown as { __marca?: number }).__marca);
      expect(marca, 'a página não foi recarregada').toBe(1);
    });

    test('3. escolha persiste ao recarregar e vale nas outras páginas', async ({ page }) => {
      await page.goto(p.path);
      await toggle(page, p.label).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
      await page.reload();
      expect(await theme(page)).toBe('dark');
      await expect(toggle(page, p.label)).toHaveAttribute('aria-pressed', 'true');
      for (const other of pages) {
        await page.goto(other.path);
        expect(await theme(page), `tema em ${other.name}`).toBe('dark');
      }
    });

    test('4. sem escolha salva, segue o sistema e não pisca (antes do JS)', async ({ page }) => {
      // Bloqueia os bundles: o tema só pode vir do script inline do <head>.
      await page.route('**/_astro/**/*.js', (route) => route.abort());
      for (const scheme of ['dark', 'light'] as const) {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto(p.path);
        expect(await theme(page)).toBe(scheme);
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
        const color = await page.evaluate(() =>
          document.querySelector('meta[name="theme-color"][media="all"]')?.getAttribute('content'),
        );
        expect(color).toBe(scheme === 'dark' ? '#111111' : '#f7f6f4');
      }
    });

    test('4b. escolha manual sobrepõe o sistema, inclusive a meta theme-color', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await page.goto(p.path);
      await toggle(page, p.label).click(); // dark -> light
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('meta[name="theme-color"][media="all"]')).toHaveAttribute(
        'content',
        '#f7f6f4',
      );
      await page.reload();
      expect(await theme(page)).toBe('light');
    });

    test('5. teclado: Tab alcança, Enter e Espaço ativam, foco visível, nome com estado', async ({
      page,
    }) => {
      await page.goto(p.path);
      const button = page.locator('[data-theme-toggle]');
      let reached = false;
      for (let i = 0; i < 30 && !reached; i++) {
        await page.keyboard.press('Tab');
        reached = await button.evaluate((el) => el === document.activeElement);
      }
      expect(reached, 'Tab chega ao botão').toBe(true);

      const outline = await button.evaluate((el) => {
        const s = getComputedStyle(el);
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThanOrEqual(2);

      await expect(page.getByRole('button', { name: p.label, pressed: false })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect(page.getByRole('button', { name: p.label, pressed: true })).toBeFocused();
      await page.keyboard.press('Space');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.getByRole('button', { name: p.label, pressed: false })).toBeFocused();
    });

    test('7. sem erros de console nem violações de CSP', async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (m) => {
        if (m.type() !== 'error' && m.type() !== 'warning') return;
        // Known/expected noise, nothing else is tolerated:
        // - the 404 page itself answers 404, which Chromium logs as a failed resource load;
        // - server.mjs sends Permissions-Policy "browsing-topics", which this Chromium build doesn't know.
        const isOwnStatus = m.location().url.endsWith(p.path) && /status of 404/.test(m.text());
        const isTopics = /Permissions-Policy.*browsing-topics/.test(m.text());
        if ((p.name === '404' && isOwnStatus) || isTopics) return;
        problems.push(`console.${m.type()}: ${m.text()}`);
      });
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) =>
          console.error(`CSP: ${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      const response = await page.goto(p.path);
      expect(response!.status()).toBe(p.name === '404' ? 404 : 200);
      // O CSP vem do <meta http-equiv> gerado pelo Astro: confirma que existe, senão o teste não prova nada.
      await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
      const button = toggle(page, p.label);
      await button.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await button.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
    });
  });
}

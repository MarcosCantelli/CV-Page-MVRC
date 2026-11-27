import { expect, test } from '@playwright/test';

// WCAG 2.x: texto normal >= 4.5:1; texto grande e componentes de UI (bordas de botão) >= 3:1.
const pairs: [string, string, number][] = [
  ['--fg', '--bg', 4.5],
  ['--fg', '--surface', 4.5],
  ['--fg', '--surface-2', 4.5],
  ['--muted', '--bg', 4.5],
  ['--muted', '--surface', 4.5],
  ['--muted', '--surface-2', 4.5],
  ['--accent', '--bg', 4.5],
  ['--accent', '--surface', 4.5],
  ['--accent', '--surface-2', 4.5],
  ['--accent', '--accent-soft', 4.5],
  ['--accent-fg', '--accent', 4.5],
  ['--border-strong', '--bg', 3],
  ['--border-strong', '--surface', 3],
];

const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminance(hex: string) {
  let n = hex.replace('#', '');
  if (n.length === 3) n = [...n].map((c) => c + c).join(''); // the minifier writes #111
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(n.slice(i, i + 2), 16) / 255));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`6. contraste AA dos tokens no tema ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const tokens = await page.evaluate(
      (names) => {
        const s = getComputedStyle(document.documentElement);
        return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n).trim()]));
      },
      [...new Set(pairs.flatMap(([a, b]) => [a, b]))],
    );
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe(scheme);
    for (const [fg, bg, min] of pairs) {
      const value = ratio(tokens[fg]!, tokens[bg]!);
      expect(value, `${fg} sobre ${bg} (${tokens[fg]} / ${tokens[bg]})`).toBeGreaterThanOrEqual(
        min,
      );
    }
  });
}

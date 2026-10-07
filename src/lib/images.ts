import type { ImageMetadata } from 'astro';

// Logos and badges are optional: drop files into src/assets/{logos,badges}/
// named after the `logo`/`badge` field in the CV content. Missing files fall back
// to initials / an icon. Files under src/assets are optimized by astro:assets.
const logoFiles = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/logos/*.{svg,png,jpg,jpeg,webp,avif}',
  { eager: true },
);
const badgeFiles = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/badges/*.{svg,png,jpg,jpeg,webp,avif}',
  { eager: true },
);

function find(files: Record<string, { default: ImageMetadata }>, name: string) {
  const entry = Object.entries(files).find(
    ([path]) =>
      path
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') === name,
  );
  return entry?.[1].default;
}

export const getLogo = (name: string) => find(logoFiles, name);
export const getBadge = (name: string) => find(badgeFiles, name);

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(-2)
    .map((w) => w[0])
    .join('');
}

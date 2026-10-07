// Generates favicon and Open Graph images into public/. Run: node tools/generate-assets.mjs
// PDFs: python3 tools/build-cv-pdf.py
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const navy = '#1F4E79';
const grey = '#6B7280';
const ink = '#1C1A19';

// Same geometry as src/components/Logo.astro (viewBox 0 0 113 30).
const wordmark = (letters, arrow, c) => `
  <g fill="none" stroke-width="4.5" stroke-linejoin="miter">
    <g stroke="${letters}">
      <path d="M3.5 27V4l11 13.5L25.5 4v23"/>
      <path d="M31 4l11 23 7-14.5"/>
      <path d="M62 27V4h10a7.25 7.25 0 0 1 0 14.5H62m8.5 0L80 27"/>
    </g>
    <path d="M49 12.5l5.5-11" stroke="${arrow}"/>
    <path d="M50.5 1.5h7v7z" fill="${arrow}" stroke="${arrow}" stroke-width="1"/>
    <path d="M107 8A11.5 11.5 0 1 0 107 23" stroke="${c}"/>
  </g>`;

// Favicon: the V with the rising arrow, white on navy.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${navy}"/>
  <g transform="translate(-36 9) scale(1.6)" fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="miter">
    <path d="M31 4l11 23 7-14.5"/>
    <path d="M49 12.5l5.5-11"/>
    <path d="M50.5 1.5h7v7z" fill="#fff" stroke-width="1"/>
  </g>
</svg>`;

const og = (
  title,
  subtitle,
  tags,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f6f4"/>
  <rect x="0" y="0" width="16" height="630" fill="${navy}"/>
  <g transform="translate(90 110) scale(2.4)">${wordmark(navy, navy, grey)}</g>
  <text x="90" y="310" font-family="Inter, Arial, Helvetica, sans-serif" font-size="54" font-weight="700" fill="${ink}">${title}</text>
  <text x="90" y="380" font-family="Inter, Arial, Helvetica, sans-serif" font-size="34" fill="#57524d">${subtitle}</text>
  <text x="90" y="500" font-family="Inter, Arial, Helvetica, sans-serif" font-size="26" fill="${navy}">${tags}</text>
  <text x="90" y="560" font-family="Inter, Arial, Helvetica, sans-serif" font-size="24" fill="#57524d">mvrc.com.br</text>
</svg>`;

const tags = 'SQL Server · Databricks · Linux · Jenkins · GitHub Actions · Terraform';

await writeFile('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(favicon))
  .resize(180, 180)
  .flatten({ background: navy })
  .png()
  .toFile('public/apple-touch-icon.png');
await sharp(
  Buffer.from(
    og('Marcos Vinícius Rodrigues Cantelli', 'Analista de BI | Dados, CI/CD e Cloud (Azure)', tags),
  ),
)
  .png()
  .toFile('public/og-pt.png');
await sharp(
  Buffer.from(
    og('Marcos Vinícius Rodrigues Cantelli', 'BI Analyst | Data, CI/CD &amp; Cloud (Azure)', tags),
  ),
)
  .png()
  .toFile('public/og-en.png');
console.log('assets generated');

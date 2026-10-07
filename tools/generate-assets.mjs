// Generates favicon and Open Graph images into public/. Run: node tools/generate-assets.mjs
// PDFs: soffice --headless --convert-to pdf --outdir public/cv docs/cv/*.docx
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const accent = '#8C2F3C';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${accent}"/>
  <text x="32" y="42" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#fff">MC</text>
</svg>`;

const og = (
  title,
  subtitle,
  tags,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f6f4"/>
  <rect x="0" y="0" width="16" height="630" fill="${accent}"/>
  <rect x="90" y="110" width="96" height="96" rx="20" fill="${accent}"/>
  <text x="138" y="173" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#fff">MC</text>
  <text x="90" y="310" font-family="Inter, Arial, Helvetica, sans-serif" font-size="54" font-weight="700" fill="#1c1a19">${title}</text>
  <text x="90" y="380" font-family="Inter, Arial, Helvetica, sans-serif" font-size="34" fill="#57524d">${subtitle}</text>
  <text x="90" y="500" font-family="Inter, Arial, Helvetica, sans-serif" font-size="26" fill="${accent}">${tags}</text>
  <text x="90" y="560" font-family="Inter, Arial, Helvetica, sans-serif" font-size="24" fill="#57524d">mvrc.com.br</text>
</svg>`;

const tags = 'SQL Server · Databricks · Linux · Jenkins · GitHub Actions · Terraform';

await writeFile('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(favicon))
  .resize(180, 180)
  .flatten({ background: accent })
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

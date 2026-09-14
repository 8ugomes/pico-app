import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const brand = join(root, 'docs/brand-exploration/aura-manteiga');
const out = join(brand, 'pico-club');
await mkdir(out, { recursive: true });
await mkdir(join(root, 'public/icons'), { recursive: true });
const require = createRequire(import.meta.url);
const fontkit = require('next/dist/compiled/@next/font/dist/fontkit').default;
const font = fontkit(await readFile(join(brand, 'fonts/manrope.ttf'))).getVariation({ wght: 300 });
const original = await readFile(join(brand, 'logo/wordmark-cacau.svg'), 'utf8');
const paths = original.slice(original.indexOf('>') + 1, original.lastIndexOf('</svg>'));
const viewBox = original.match(/viewBox="([^"]+)"/)[1];
const ink = '#44342F';
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="Pico Clube">${body}</svg>`;

// The neutral grain lives behind the vector letters. Fixed seed makes exports reproducible.
const side = 256, pixels = Buffer.alloc(side * side);
let seed = 13092026;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 1) / 4294967297; };
for (let i = 0; i < pixels.length; i++) {
  pixels[i] = Math.max(0, Math.min(255, Math.round(128 + 40 * Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random()))));
}
const grain = await sharp(pixels, { raw: { width: side, height: side, channels: 1 } }).png().toBuffer();
await writeFile(join(out, 'grain.png'), grain);
const fields = svg(`<defs>
  <radialGradient id="lavender" cx="5%" cy="88%" r="90%"><stop stop-color="#BFAED5"/><stop offset=".48" stop-color="#CBBBE0" stop-opacity=".9"/><stop offset="1" stop-color="#CBBBE0" stop-opacity="0"/></radialGradient>
  <radialGradient id="butter" cx="93%" cy="16%" r="84%"><stop stop-color="#ECCC7B"/><stop offset=".45" stop-color="#F2E3B5" stop-opacity=".95"/><stop offset="1" stop-color="#F2E3B5" stop-opacity="0"/></radialGradient>
  <radialGradient id="paper" cx="18%" cy="0%" r="65%"><stop stop-color="#F8F3E7"/><stop offset="1" stop-color="#F8F3E7" stop-opacity="0"/></radialGradient>
</defs><path fill="#F2E3B5" d="M0 0H1024V1024H0Z"/><path fill="url(#lavender)" d="M0 0H1024V1024H0Z"/><path fill="url(#butter)" d="M0 0H1024V1024H0Z"/><path fill="url(#paper)" d="M0 0H1024V1024H0Z"/>`);
const background = await sharp(Buffer.from(fields)).composite([{ input: grain, tile: true, blend: 'soft-light' }]).removeAlpha().png().toBuffer();
await writeFile(join(out, 'background.png'), background);
const image = buffer => `<image width="1024" height="1024" href="data:image/png;base64,${buffer.toString('base64')}"/>`;
function wordmark(width, y) {
  return `<svg x="${(1024 - width) / 2}" y="${y}" width="${width}" height="${width * 963 / 3319}" viewBox="${viewBox}" fill="${ink}">${paths}</svg>`;
}
function subtitle() {
  const run = font.layout('Clube'), scale = 84 / font.unitsPerEm, spacing = 15;
  const width = run.positions.reduce((sum, p) => sum + p.xAdvance * scale, 0) + spacing * (run.glyphs.length - 1);
  let x = (1024 - width) / 2;
  return run.glyphs.map((g, i) => {
    const p = run.positions[i];
    const glyph = `<path fill="${ink}" transform="translate(${x + p.xOffset * scale} ${672 - p.yOffset * scale}) scale(${scale} ${-scale})" d="${g.path.toSVG()}"/>`;
    x += p.xAdvance * scale + spacing;
    return glyph;
  }).join('');
}
const master = svg(image(background) + wordmark(790, 337) + subtitle());
const maskable = svg(image(background) + wordmark(730, 349) + subtitle());
await writeFile(join(out, 'icon.svg'), master);
await writeFile(join(out, 'maskable.svg'), maskable);
await sharp(Buffer.from(master)).removeAlpha().png().toFile(join(out, 'icon-1024.png'));
const exports = [
  ['public/icons/pico-club-192.png', 192, master],
  ['public/icons/pico-club-512.png', 512, master],
  ['public/icons/pico-club-maskable-512.png', 512, maskable],
  ['public/icons/pico-192.png', 192, master],
  ['public/icons/pico-512.png', 512, master],
  ['public/icons/pico-maskable-512.png', 512, maskable],
  ['src/app/apple-icon.png', 180, master],
];
for (const [path, size, source] of exports) {
  await sharp(Buffer.from(source)).resize(size, size).removeAlpha().png().toFile(join(root, path));
}

// At favicon sizes the secondary line becomes noise; use the exact Pico wordmark alone.
const compactBackground = await sharp(background).resize(128).png().toBuffer();
const favicon = svg(image(compactBackground) + wordmark(930, 377));
await writeFile(join(root, 'src/app/icon.svg'), favicon);
const icoSizes = [16, 32, 48], icoImages = [];
for (const size of icoSizes) icoImages.push(await sharp(Buffer.from(favicon)).resize(size).ensureAlpha().png().toBuffer());
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoImages.forEach((buffer, i) => {
  const entry = 6 + 16 * i;
  header[entry] = icoSizes[i]; header[entry + 1] = icoSizes[i];
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(buffer.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
  offset += buffer.length;
});
await writeFile(join(root, 'src/app/favicon.ico'), Buffer.concat([header, ...icoImages]));

const previews = [];
for (const [i, size] of [180, 120, 80, 60].entries()) {
  const rounded = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * .22}" fill="white"/></svg>`);
  const icon = await sharp(Buffer.from(master)).resize(size).composite([{ input: rounded, blend: 'dest-in' }]).png().toBuffer();
  previews.push({ input: icon, left: 670, top: 45 + i * 195 });
}
const circle = await sharp(Buffer.from(maskable)).resize(180).composite([{ input: Buffer.from('<svg width="180" height="180"><circle cx="90" cy="90" r="90" fill="white"/></svg>'), blend: 'dest-in' }]).png().toBuffer();
previews.push({ input: circle, left: 880, top: 45 });
previews.push({ input: await sharp(Buffer.from(master)).resize(560).png().toBuffer(), left: 45, top: 45 });
for (let i = 0; i < 2; i++) previews.push({ input: icoImages[i], left: 900 + i * 65, top: 315 });
await sharp({ create: { width: 1110, height: 850, channels: 4, background: '#F8F3E7' } }).composite(previews).png().toFile(join(out, 'preview.png'));
const audit = [];
for (const [path, size] of exports) {
  const info = await sharp(join(root, path)).metadata();
  if (info.width !== size || info.height !== size || info.hasAlpha) throw Error(`Invalid icon: ${path}`);
  audit.push({ path, width: info.width, height: info.height, opaque: true });
}
await writeFile(join(out, 'exports.json'), JSON.stringify({ label: 'Pico / Clube', installName: 'Pico Club', originalWordmark: 'logo/wordmark-cacau.svg', secondaryTypeface: 'Manrope 300', maskableWordmarkBounds: { x: 147, y: 349, width: 730, height: 730 * 963 / 3319 }, icons: audit }, null, 2) + '\n');
console.log(`Pico Club: ${exports.length} ícones opacos, favicon e mestres exportados.`);

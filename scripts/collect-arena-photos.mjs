// Public venue galleries only. Collect into an ignored review folder; never publish automatically.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const catalog = JSON.parse(readFileSync('src/data/arena-catalog.json', 'utf8'));
const root = '.vercel/arena-research';
mkdirSync(root + '/photos', { recursive: true });
const allowedPages = new Set(['totalpass.com', 'wellhub.com', 'posto011.com.br']);
const allowedImages = new Set(['images.totalpass.com', 'assets-cdn.wellhub.com', 'posto011.com.br']);
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
async function get(url, hosts, maxBytes) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !hosts.has(parsed.hostname) || parsed.username || parsed.password) throw Error('Unapproved public source');
  const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw Error('Source HTTP ' + r.status);
  const chunks = []; let size = 0;
  for await (const chunk of r.body) { size += chunk.length; if (size > maxBytes) throw Error('Source exceeds limit'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7).split(',');
const results = only ? JSON.parse(readFileSync(root + '/photos.json', 'utf8')).filter(r => !only.includes(r.slug)) : [];
for (const arena of catalog.arenas) {
  if (only && !only.includes(arena.slug)) continue;
  const result = { slug: arena.slug, page: arena.photoPage, collectedAt: new Date().toISOString(), photos: [] };
  try {
    const html = (await get(arena.photoPage, allowedPages, 5e6)).toString('utf8');
    const urls = [...new Set([...html.matchAll(/<img\b[^>]*>/g)].flatMap(([tag]) => {
      const alt = tag.match(/\balt="([^"]*)"/)?.[1] || '';
      const src = tag.match(/\bsrc="([^"]*)"/)?.[1];
      if (new URL(arena.photoPage).hostname === 'posto011.com.br' && src?.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const set = tag.match(/\bsrcset="([^"]*)"/)?.[1];
        const candidate = set?.split(',').map(s => s.trim().split(/\s+/)).find(s => s[1] === '1024w');
        return [decode(candidate?.[0] ?? src)];
      }
      return src && (/Imagem da estrutura da academia/.test(alt) || /Imagem \d+ da galeria do parceiro/.test(alt)) ? [decode(src)] : [];
    }))];
    if (!urls.length || urls.length > 25) throw Error('Gallery needs manual review');
    const hashes = new Set();
    for (const url of urls) {
      const bytes = await get(url, allowedImages, 12e6);
      const { data, info } = await sharp(bytes, { limitInputPixels: 32e6 }).rotate().resize({ width: 1280, height: 960, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      const hash = createHash('sha256').update(data).digest('hex');
      if (hashes.has(hash)) continue;
      hashes.add(hash);
      const file = `${arena.slug}-${result.photos.length + 1}.webp`;
      writeFileSync(root + '/photos/' + file, data);
      result.photos.push({ file, width: info.width, height: info.height, bytes: info.size, sha256: hash, sourceUrl: url, sourcePage: arena.photoPage });
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  } catch (e) { result.error = e.message; }
  results.push(result);
  writeFileSync(root + '/photos.json', JSON.stringify(results, null, 2) + '\n');
  console.log(arena.slug, result.photos.length, result.error || 'collected for review');
  await new Promise(resolve => setTimeout(resolve, 800));
}
if (results.some(r => r.error)) process.exitCode = 1;

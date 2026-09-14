// Isolated real components with loopback API fixtures. No hosted accounts or writes.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd(), output = resolve('.vercel/composition-review');
mkdirSync(output, { recursive: true });
const shell = `import React from 'react'; import {createRoot} from 'react-dom/client'; import {PublicationComposer} from '${root}/src/components/pico/connected/PublicationComposer'; import {ConnectedGames} from '${root}/src/components/pico/connected/ConnectedGames'; createRoot(document.getElementById('root')).render(<main className="social-main">{location.search.includes('games') ? <ConnectedGames /> : <PublicationComposer viewerId="11111111-1111-4111-8111-111111111111" communityId="33333333-3333-4333-8333-333333333333" onDone={()=>{}} />}</main>);`;
const stubs = {
  'next/link': `import React from 'react'; export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}`,
  'next/image': `import React from 'react'; export default function Image({unoptimized,fill,priority,...props}){return <img {...props}/>}`,
  'next/dynamic': `import React,{Suspense,lazy} from 'react'; export default function dynamic(load,options={}){const C=lazy(load);return function Dynamic(props){return <Suspense fallback={options.loading?.()||null}><C {...props}/></Suspense>}}`,
  'next/navigation': `export const useRouter=()=>({push(){},replace(){},refresh(){}}); export const usePathname=()=>'/feed';`,
};
await build({ stdin: { contents: shell, loader: 'tsx', resolveDir: root }, outdir: join(output, 'app'), entryNames: 'app', bundle: true, splitting: true, format: 'esm', jsx: 'automatic', platform: 'browser', target: 'es2022', alias: { '@': join(root, 'src') }, plugins: [{ name: 'next-stubs', setup(api) { api.onResolve({ filter: /^next\/(link|image|dynamic|navigation)$/ }, args => ({ path: args.path, namespace: 'next-stub' })); api.onLoad({ filter: /.*/, namespace: 'next-stub' }, args => ({ contents: stubs[args.path], loader: 'tsx', resolveDir: root })); } }], define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_PICO_ENV': '"development"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': 'undefined', 'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': 'undefined' } });
const css = ['globals.css', 'social.css', 'social-pages.css', 'forms.css', 'journey.css'].map(file => readFileSync(join(root, 'src/app', file), 'utf8').replace(/^@import.*$/gm, '').replace(/@theme inline\s*\{[^}]*\}/g, '')).join('\n');
writeFileSync(join(output, 'style.css'), css + '\nbody{max-width:680px;margin:auto}#root{padding:20px}');
const html = '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/app/app.js"></script></html>';
const server = createServer((request, response) => { try { const url = new URL(request.url, 'http://localhost'); if (url.pathname === '/' || url.pathname === '/feed') { response.setHeader('Content-Type', 'text/html'); response.end(html); return; } const path = resolve(output, '.' + url.pathname); if (!path.startsWith(output + '/')) throw Error('Bad path'); response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript'); response.end(readFileSync(path)); } catch { response.writeHead(404); response.end(); } });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const communityId = '33333333-3333-4333-8333-333333333333', personId = '44444444-4444-4444-8444-444444444444';
const arena = { id: '22222222-2222-4222-8222-222222222222', slug: 'areia', name: 'Areia da Vila', city: 'São Paulo', neighborhood: 'Vila Mariana', description: '', image: null, isDemo: false, sports: [{ id: '55555555-5555-4555-8555-555555555555', slug: 'futevolei', name: 'Futevôlei' }] };
const posts = [], games = [], errors = [];
let failGame = true;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), body = request.method() === 'POST' ? request.postDataJSON() : {};
    const reply = (data, status = 200) => route.fulfill({ status, json: data });
    if (url.pathname === '/api/posts') {
      if (request.method() === 'POST') { posts.push(body); return reply({ data: '66666666-6666-4666-8666-666666666666' }); }
      return reply({ data: { arenas: [], communities: [{ id: communityId, name: 'Turma da Areia', visibility: 'beta' }] } });
    }
    if (url.pathname === '/api/communities') return reply({ data: 'paula'.includes(url.searchParams.get('search')?.toLowerCase() ?? '') ? [{ id: personId, name: 'Paula Silva', username: 'paula' }] : [] });
    if (url.pathname === '/api/games') {
      if (request.method() === 'GET') return reply({ data: games });
      if (failGame) { failGame = false; return reply({ message: 'Falha controlada.' }, 503); }
      games.push({ id: body.id, arena_id: arena.id, arena_slug: arena.slug, arena_name: arena.name, sport_id: arena.sports[0].id, sport_slug: 'futevolei', sport_name: 'Futevôlei', played_on: body.playedOn, created_at: '2026-09-14T12:00:00Z', updated_at: '2026-09-14T12:00:00Z', version: 1, is_demo: false });
      return reply({ data: { id: body.id } });
    }
    if (url.pathname === '/api/social/read') return reply({ status: 'success', data: url.searchParams.get('resource') === 'arenas' ? { kind: 'arenas', arenas: [arena], sports: arena.sports, hasMore: false, offset: 0 } : { kind: 'sports', sports: arena.sports } });
    if (url.pathname === '/api/games/legacy') return reply({ data: [] });
    return reply({ data: null });
  });
  await page.goto(origin + '/feed');
  await page.getByRole('button', { name: 'O que aconteceu na areia?' }).click();
  const draft = page.getByRole('textbox', { name: 'Texto da publicação' });
  await draft.waitFor();
  assert.equal(await draft.evaluate(element => element === document.activeElement), true);
  await draft.fill('Oi @p');
  await page.getByRole('button', { name: /Paula Silva/ }).click();
  assert.match(await draft.inputValue(), /^Oi @paula /);
  await draft.fill('Oi @paula, bora jogar?');
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].body, 'Oi @paula, bora jogar?');
  assert.deepEqual(posts[0].mentionPeople, [personId]);
  assert.equal(posts[0].mentionCommunity, communityId);
  await page.getByRole('button', { name: 'O que aconteceu na areia?' }).click();
  await draft.fill('Ei @to');
  await page.getByRole('button', { name: /@todos/ }).click();
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  assert.equal(posts[1].mentionEveryone, true);
  assert.equal(posts[1].body.trim(), 'Ei @todos');

  await page.goto(origin + '/?games');
  await page.getByRole('button', { name: 'Registrar jogo' }).click();
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('combobox', { name: 'Onde você jogou?' }).selectOption(arena.id);
  await page.getByRole('button', { name: 'Hoje', exact: true }).click();
  for (const [width, scheme] of [[320, 'light'], [390, 'dark'], [1280, 'light']]) {
    await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme: scheme });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.screenshot({ path: join(output, `game-${width}-${scheme}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Guardar só para mim' }).click();
  await page.getByRole('alert').getByText(/Falha controlada/).waitFor();
  assert.ok(await page.getByRole('combobox', { name: 'Modalidade' }).inputValue());
  await page.getByRole('button', { name: 'Guardar só para mim' }).click();
  assert.equal(games.length, 1);
  assert.equal(posts.length, 2);
  assert.deepEqual(errors, []);
  writeFileSync(join(output, 'result.json'), JSON.stringify({ posts: posts.length, games: games.length, fixture: true, hosted: false, errors }, null, 2));
  console.log('Inline composer, mentions, private game retry and 3 visual sizes passed.');
} finally { await browser.close(); server.close(); }

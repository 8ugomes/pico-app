// Real built connected UI with intercepted APIs; no remote data, credentials or writes.
// Build with NEXT_PUBLIC_PICO_ENV=development and a local fixture key, PICO_BUILD_DIR=.next-ranking, then:
// RANKING_BASE_URL=http://127.0.0.1:3021 node tests/browser-arena-ranking.mjs
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const version = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.RANKING_BASE_URL || 'http://127.0.0.1:3021';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const output = process.env.PICO_REVIEW_DIR || '.vercel/ranking-review';
mkdirSync(output, { recursive: true });

const ME = '30000000-0000-4000-8000-000000000001';
const ARENA = { id: '20000000-0000-4000-8000-0000000000aa', slug: 'arena-ranking', name: 'Arena do Ranking', description: '', neighborhood: 'Moema', city: 'São Paulo', image: null, isDemo: false, sports: [{ id: '10000000-0000-4000-8000-000000000001', slug: 'futevolei', name: 'Futevôlei' }] };
const sport = ARENA.sports[0];
const profile = { id: ME, username: 'alice_teste', name: 'Alice Teste', onboardingCompleted: true, avatar: '/icon.svg', avatarPath: 'fixture.webp', bio: 'Jogo no fim de tarde.', city: 'São Paulo', neighborhood: 'Moema', available: false, isDemo: false, sports: [{ sport, level: 'Iniciante', isPrimary: true }] };
const state = { mode: 'ok', today: false, recent: [], pointsByPeriod: { week: 12, month: 40, all: 130 }, gate: null };
const writes = [], checks = [], errors = [], rankingRequests = [];
const day = back => { const d = new Date(); d.setDate(d.getDate() - back); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function ranking(period) {
  const mine = state.pointsByPeriod[period] + (state.today ? 5 : 0);
  if (state.mode === 'empty') return { period, since: null, entries: [], me: { rank: null, points: 0, all_points: 0 }, breakdown: {}, today_done: state.today, recent_days: state.recent, total_players: 0 };
  const others = [{ rank: 1, player_id: 'p1', username: 'julia', name: 'Júlia Ramos', avatar: null, points: mine + 30, me: false }];
  const me = { rank: 2, player_id: ME, username: 'alice_teste', name: 'Alice Teste', avatar: null, points: mine, me: true };
  return { period, since: null, entries: [...others, me], me: { rank: 2, points: mine, all_points: state.pointsByPeriod.all + (state.today ? 5 : 0) },
    breakdown: { checkin: { points: 10, count: 2 }, post: { points: 6, count: 3 }, like_received: { points: 4, count: 4 } }, today_done: state.today, recent_days: state.recent, total_players: 2 };
}

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));
await context.route('**/*', async route => {
  const req = route.request(), url = new URL(req.url());
  if (url.origin !== origin) return route.abort();
  if (!url.pathname.startsWith('/api/')) return route.continue();
  const send = (data, status = 200) => route.fulfill({ status, json: data, headers: { 'cache-control': 'no-store' } });
  const q = url.searchParams;
  if (url.pathname === '/api/access') return send({ admitted: true, signedIn: true });
  if (url.pathname === '/api/version') return send({ version });
  if (url.pathname === '/api/welcome') return send({ data: { pending: false } });
  if (url.pathname === '/api/arenas/ranking') {
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      writes.push(body);
      if (state.gate) await state.gate;
      if (state.mode === 'write-error') return send({ message: 'Não foi possível confirmar a alteração. Atualize para conferir antes de tentar de novo.' }, 503);
      if (body.arenaId !== ARENA.id || !['record', 'remove'].includes(body.action)) return send({ message: 'Ação inválida.' }, 400);
      const target = body.day || day(0);
      if (body.action === 'record') { if (!state.recent.includes(target)) state.recent.push(target); } else state.recent = state.recent.filter(d => d !== target);
      state.today = state.recent.includes(day(0));
      return send({ data: { ok: true } });
    }
    rankingRequests.push(url.search);
    if (q.get('kind') === 'activity') {
      if (state.mode === 'activity-empty') return send({ data: { period: q.get('period'), since: null, arenas: [] } });
      return send({ data: { period: q.get('period'), since: null, arenas: [{ id: ARENA.id, slug: ARENA.slug, name: ARENA.name, neighborhood: 'Moema', city: 'São Paulo', players: 4, checkins: 9 }] } });
    }
    if (state.mode === 'read-error') return send({ message: 'Não foi possível carregar agora. Confira sua conexão e tente novamente.' }, 503);
    if (q.get('arenaId') !== ARENA.id) return send({ message: 'Confira os campos.' }, 400);
    if (state.mode === 'slow') await new Promise(r => setTimeout(r, 900));
    return send({ data: ranking(q.get('period')) });
  }
  if (url.pathname === '/api/social/read') {
    const r = q.get('resource');
    if (r === 'profile') return send({ status: 'success', data: { kind: r, profile } });
    if (r === 'sports') return send({ status: 'success', data: { kind: r, sports: [sport] } });
    if (r === 'arenas') return send({ status: 'success', data: { kind: r, arenas: [ARENA], sports: [sport], hasMore: false, offset: 0 } });
    if (r === 'arena') return send({ status: 'success', data: { kind: r, arena: ARENA } });
    if (r === 'feed') return send({ status: 'success', data: { kind: r, posts: [], hasMore: false, offset: 0 } });
    return send({ status: 'success', data: { kind: r } });
  }
  if (url.pathname === '/api/arenas') return send({ data: q.get('kind') ? [] : { ...ARENA, public_info: '', avatar_path: null, cover_path: null, version: 1, rank: 0, is_demo: false, membership: null, sports: ARENA.sports, owner: null, staff: [] } });
  if (url.pathname === '/api/posts') return send({ data: { posts: [], hasMore: false, viewerId: ME } });
  if (url.pathname === '/api/activity') return send({ data: [] });
  return send({ data: [] });
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', e => errors.push(process.env.RANKING_DEBUG ? e.stack.slice(0, 500) : e.message));
page.on('console', m => { if (process.env.RANKING_DEBUG) console.error('console:', m.text().slice(0, 300)); });
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
const panel = () => page.locator('.arena-ranking');
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
let failure = null;
try {
  // List: "Em movimento" shows the most active arena and links to it.
  await page.goto(origin + '/arenas');
  await page.getByRole('heading', { name: 'Em movimento' }).waitFor();
  await page.locator('.arena-activity-list a').first().waitFor();
  check((await page.locator('.arena-activity-list a').first().getAttribute('href')) === '/arenas/arena-ranking', 'Em movimento links to the arena');
  check((await page.locator('.arena-activity-list').innerText()).includes('4 pessoas'), 'Em movimento shows people count');
  await page.getByRole('button', { name: 'Mês', exact: true }).first().click();
  await page.waitForFunction(() => document.querySelectorAll('.arena-activity-list a').length === 1);
  check(rankingRequests.some(s => s.includes('kind=activity') && s.includes('period=month')), 'activity period change refetches');

  // Detail: loading skeleton, then ranking with level and breakdown.
  state.mode = 'slow';
  await page.goto(origin + '/arenas/arena-ranking');
  await page.getByRole('heading', { name: 'Ranking da arena' }).waitFor();
  await page.locator('.ranking-loading, [aria-label="Carregando ranking"]').first().waitFor();
  check(true, 'loading skeleton appears while the ranking loads');
  state.mode = 'ok';
  await panel().getByText('Júlia Ramos').waitFor();
  check((await panel().innerText()).includes('Você está em 2º lugar nesta semana, com 12 pontos.'), 'summary states rank and points for the week');
  check((await panel().innerText()).includes('Rally'), 'level reflects total points (130 = Rally)');
  check((await panel().locator('[role=progressbar]').getAttribute('aria-valuenow')) !== null, 'level progress bar is exposed to assistive tech');
  check((await panel().locator('.point-breakdown').innerText()).includes('Publicações'), 'breakdown lists where points come from');
  await panel().getByText('Como pontuar').click();
  check((await panel().locator('.point-rules').innerText()).includes('Check-in do dia'), 'point rules are readable');
  check((await overflow()) <= 0, 'no horizontal overflow at 390 px');

  // Period tabs refetch and update the numbers.
  await panel().getByRole('button', { name: 'Geral', exact: true }).click();
  await panel().getByText('Você está em 2º lugar desde o início, com 130 pontos.').waitFor();
  check(rankingRequests.some(s => s.includes('period=all')), 'switching period refetches the ranking');
  await panel().getByRole('button', { name: 'Semana', exact: true }).click();
  await panel().getByText(/nesta semana, com 12 pontos/).waitFor();

  // Check-in: success text only after the server answers; points change after reload.
  let release; state.gate = new Promise(r => { release = r; });
  const record = panel().getByRole('button', { name: 'Fiz check-in hoje' });
  await record.click();
  await panel().getByRole('button', { name: /Salvando/ }).waitFor();
  check((await panel().getByRole('button', { name: /Salvando/ }).getAttribute('aria-busy')) === 'true', 'button is aria-busy while saving');
  check(!(await panel().innerText()).includes('Check-in registrado'), 'no success message before the server answers');
  release(); state.gate = null;
  await panel().getByText('Check-in registrado.').waitFor();
  await panel().getByRole('button', { name: 'Desfazer check-in de hoje' }).waitFor();
  await panel().getByText(/com 17 pontos/).waitFor();
  check(writes[0].action === 'record' && writes[0].arenaId === ARENA.id && !('day' in writes[0]), 'today check-in sends only the arena (server decides the day)');
  check(JSON.stringify(Object.keys(writes[0]).sort()) === '["action","arenaId"]', 'payload has no forged identity or points');

  // Other day chip records an explicit past day, then removes it.
  await panel().getByText('Registrar outro dia').click();
  const yesterday = panel().locator('.checkin-days button', { hasText: 'Ontem' });
  await yesterday.click();
  await panel().getByText('Check-in registrado.').waitFor();
  check(writes[1].action === 'record' && writes[1].day === day(1), 'past day check-in sends that exact day');
  await panel().locator('.checkin-days button', { hasText: 'Ontem' }).waitFor();
  check((await panel().locator('.checkin-days button', { hasText: 'Ontem' }).getAttribute('aria-pressed')) === 'true', 'recorded day chip is pressed');
  await panel().locator('.checkin-days button', { hasText: 'Ontem' }).click();
  await panel().getByText('Check-in removido.').waitFor();
  check(writes[2].action === 'remove' && writes[2].day === day(1), 'tapping a pressed day removes it');
  await panel().getByRole('button', { name: 'Desfazer check-in de hoje' }).click();
  await panel().getByRole('button', { name: 'Fiz check-in hoje' }).waitFor();
  check(writes[3].action === 'remove' && /^\d{4}-\d{2}-\d{2}$/.test(writes[3].day) && writes[3].day === day(0), 'undo today removes today');
  await page.screenshot({ path: output + '/ranking-390.png', fullPage: false });

  // Failure on write keeps the previous state and explains it.
  state.mode = 'write-error';
  await panel().getByRole('button', { name: 'Fiz check-in hoje' }).click();
  await panel().getByText(/Não foi possível confirmar/).waitFor();
  check(await panel().getByRole('button', { name: 'Fiz check-in hoje' }).isVisible(), 'a failed write leaves the button in its previous state');
  state.mode = 'ok';

  // Empty and read-error states.
  state.mode = 'empty';
  await page.reload();
  await panel().getByText('Ninguém por aqui nesta semana.').waitFor();
  check((await panel().innerText()).includes('Você ainda não pontuou nesta semana.'), 'empty ranking invites the first check-in');
  state.mode = 'read-error';
  await page.reload();
  await panel().getByRole('alert').waitFor();
  state.mode = 'ok';
  await panel().getByRole('button', { name: 'Tentar novamente' }).click();
  await panel().getByText('Júlia Ramos').waitFor();
  check(true, 'read error offers retry that recovers');

  // 320 px and dark scheme.
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.reload();
  await panel().getByText('Júlia Ramos').waitFor();
  check((await overflow()) <= 0, 'no horizontal overflow at 320 px in dark');
  await page.screenshot({ path: output + '/ranking-320-dark.png' });
  check(errors.length === 0, 'no uncaught page errors: ' + errors.join('|'));
} catch (error) { failure = error; try { console.error('PAGEERRORS', errors.join(' | ').slice(0, 800)); console.error('URL', page.url(), '\n' + (await page.innerText('body')).slice(0, 600)); } catch {} }
writeFileSync(output + '/results.json', JSON.stringify({ checks, errors, writes, failure: failure && String(failure.message || failure) }, null, 2));
await browser.close();
if (failure) { console.error(failure); process.exit(1); }
console.log(`${checks.length} checks passed`);

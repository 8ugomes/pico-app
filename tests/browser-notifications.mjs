// Focused UI states against the compiled Next app, with explicit network fixtures.
// PLAYWRIGHT_MODULE=<playwright/index.mjs> node tests/browser-notifications.mjs
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const origin = process.env.PICO_TEST_ORIGIN || 'http://localhost:3002', output = '.vercel/notifications-review';
mkdirSync(output, { recursive: true });
const id = '30000000-0000-4000-8000-000000000001';
const avatarPath = '30000000-0000-4000-8000-000000000002/33333333-3333-4333-8333-333333333333.webp';
const item = { id, kind: 'community_join', created_at: '2026-09-13T19:30:00Z', read_at: null, actor_name: 'Camila · exemplo', actor_avatar_path: avatarPath, community_name: 'Turma do fim de tarde · exemplo', community_slug: 'grupo-exemplo' };
const context = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
if (process.env.PICO_TEST_USE_FIXTURE === '1') {
  const fixture = JSON.parse(readFileSync('.vercel/cycle9-fixture.json', 'utf8'));
  const controlled = fixture.users.find(user => user.label === 'owner-a');
  await context.addCookies(controlled.cookies.map(({ name, value }) => ({ name, value, url: origin })));
}
const page = await context.newPage(), errors = [], checks = [];
page.on('pageerror', e => errors.push(e.message));
let mode = 'list';
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) return route.abort();
  if (!url.pathname.startsWith('/api/')) return route.continue();
  const send = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  if (url.pathname === '/api/access') return send({ admitted: true, signedIn: true });
  if (url.pathname === '/api/version') return send({ version: 'fixture' });
  if (url.pathname === '/api/welcome') return send({ data: null });
  if (url.pathname === '/api/social/read') return send({ status: 'success', data: { kind: 'profile', profile: { id, name: 'Perfil de exemplo', username: 'perfil_exemplo', avatarPath: 'fixture.webp', avatar: null, sports: [{ isPrimary: true, sport: { id, name: 'Beach Tennis', slug: 'beach-tennis' }, level: 'Iniciante' }], onboardingCompleted: true } } });
  if (url.pathname === '/api/media') {
    assert.equal(url.searchParams.get('bucket'), 'avatars');
    assert.equal(url.searchParams.get('path'), avatarPath);
    return route.fulfill({ status: 200, contentType: 'image/webp', body: readFileSync('public/images/players.webp') });
  }
  if (url.pathname === '/api/notifications') {
    if (mode === 'error') return send({ message: 'Falha de conexão de teste.' }, 503);
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 800));
    return send({ data: { items: mode === 'empty' ? [] : [{ ...item, actor_name: url.searchParams.has('before') ? 'Bruno · exemplo' : item.actor_name, actor_avatar_path: url.searchParams.has('before') ? null : avatarPath }], unreadCount: mode === 'empty' ? 0 : 2, nextCursor: mode !== 'empty' && !url.searchParams.has('before') ? id : null } });
  }
  return send({ data: null });
});
try {
  await page.goto(origin + '/notificacoes');
  await page.locator('.notification-row').waitFor();
  await page.waitForFunction(() => { const image = document.querySelector('.notification-person img'); return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0; });
  for (const [theme, scale] of [['dark', 1], ['light', 2]]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate(async scale => { document.documentElement.style.fontSize = 16 * scale + 'px'; await document.fonts.ready; }, scale);
    const layout = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, avatarVisible: document.querySelector('.notification-person').getClientRects().length > 0 }));
    assert.ok(layout.document <= layout.width + 1);
    assert.equal(layout.avatarVisible, true);
    checks.push({ theme, scale, ...layout });
    await page.screenshot({ path: `${output}/final-${theme}-320-${scale}.png`, fullPage: true });
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.getByRole('button', { name: 'Mais antigas', exact: true }).click();
  await page.locator('.notification-content').filter({ hasText: 'Bruno · exemplo' }).waitFor();
  assert.equal(await page.locator('.notification-person img').count(), 0);
  assert.equal(await page.locator('.notification-person svg').count(), 1);
  await page.getByRole('button', { name: 'Mais recentes', exact: true }).click();
  await page.locator('.notification-content').filter({ hasText: 'Camila · exemplo' }).waitFor();
  checks.push('next and previous page');
  mode = 'error';
  await page.getByRole('button', { name: 'Atualizar notificações', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Não deu para carregar' }).waitFor();
  assert.equal(await page.locator('.notification-row').count(), 0);
  assert.equal(await page.locator('.notification-count').count(), 0);
  checks.push('read error clears stale private data and counter');
  mode = 'empty';
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await page.getByRole('heading', { name: 'Nenhuma notificação por enquanto.' }).waitFor();
  checks.push('retry and empty state');
  mode = 'slow';
  await page.reload();
  await page.getByRole('status').filter({ hasText: 'Carregando notificações' }).waitFor();
  await page.locator('.notification-row').waitFor();
  checks.push('loading state');
  assert.deepEqual(errors, []);
  writeFileSync(output + '/states.json', JSON.stringify({ checks, errors }, null, 2));
  console.log('Notification UI states passed');
} finally { await browser.close(); }

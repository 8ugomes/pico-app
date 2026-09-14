// Focused UI states against the compiled Next app, with explicit network fixtures.
// PLAYWRIGHT_MODULE=<playwright/index.mjs> node tests/browser-notifications.mjs
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const origin = 'http://localhost:3002', output = '.vercel/notifications-review';
mkdirSync(output, { recursive: true });
const id = '30000000-0000-4000-8000-000000000001';
const item = { id, kind: 'community_join', created_at: '2026-09-13T19:30:00Z', read_at: null, actor_name: 'Camila · exemplo', community_name: 'Turma do fim de tarde · exemplo', community_slug: 'grupo-exemplo' };
const context = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
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
  if (url.pathname === '/api/notifications') {
    if (mode === 'error') return send({ message: 'Falha de conexão de teste.' }, 503);
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 800));
    return send({ data: { items: mode === 'empty' ? [] : [{ ...item, actor_name: url.searchParams.has('before') ? 'Bruno · exemplo' : item.actor_name }], unreadCount: mode === 'empty' ? 0 : 2, nextCursor: mode !== 'empty' && !url.searchParams.has('before') ? id : null } });
  }
  return send({ data: null });
});
try {
  await page.goto(origin + '/notificacoes');
  await page.locator('.notification-row').waitFor();
  for (const [theme, scale] of [['dark', 1], ['light', 2]]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate(async scale => { document.documentElement.style.fontSize = 16 * scale + 'px'; await document.fonts.ready; }, scale);
    const layout = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, iconVisible: document.querySelector('.notification-person').getClientRects().length > 0 }));
    assert.ok(layout.document <= layout.width + 1);
    assert.equal(layout.iconVisible, false);
    checks.push({ theme, scale, ...layout });
    await page.screenshot({ path: `${output}/final-${theme}-320-${scale}.png`, fullPage: true });
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.getByRole('button', { name: 'Mais antigas', exact: true }).click();
  await page.locator('.notification-content').filter({ hasText: 'Bruno · exemplo' }).waitFor();
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

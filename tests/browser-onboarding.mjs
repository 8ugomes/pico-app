// Real built Next UI; all APIs are loopback fixtures and external requests denied.
// Start .next-tour on 3017 and visual-preview.mjs on 3002. No hosted writes.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TOUR_BASE_URL || 'http://127.0.0.1:3017';
const fixture = 'http://127.0.0.1:3002';
const output = process.env.PICO_REVIEW_DIR || 'docs/onboarding-review';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [], writes = [], checks = [], layouts = [];
let anonymousPrivateReads = 0;
let identity = '30000000-0000-4000-8000-000000000001', access = true, signedIn = true, brokenProfile = false;
page.on('pageerror', error => errors.push(error.message));
await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
await context.route('**/api/**', async route => {
  const url = new URL(route.request().url());
  if (!signedIn && ['/api/social/read', '/api/notifications'].includes(url.pathname)) anonymousPrivateReads += 1;
  // The institutional welcome is independent of the optional guided tour.
  if (url.pathname === '/api/welcome') return route.fulfill({ json: { data: null } });
  if (route.request().method() !== 'GET') writes.push(url.pathname);
  if (url.pathname === '/api/access') return route.fulfill({ status: signedIn ? 200 : 401, json: { admitted: access, signedIn } });
  if (url.pathname === '/api/social/read' && url.searchParams.get('resource') === 'profile') {
    if (brokenProfile) return route.fulfill({ status: 503, json: { status: 'error', code: 'unavailable', message: 'Falha controlada.' } });
    const response = await route.fetch({ url: fixture + url.pathname + url.search });
    const body = await response.json();
    if (body.data?.profile) body.data.profile.id = identity;
    return route.fulfill({ json: body });
  }
  await route.fulfill({ response: await route.fetch({ url: fixture + url.pathname + url.search }) });
});
await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));
const guide = page.getByTestId('guided-tour');
const visible = locator => locator.waitFor({ state: 'visible' });
const hidden = locator => locator.waitFor({ state: 'hidden' });
async function shot(name) { await page.screenshot({ path: `${output}/${name}.png` }); }
async function fits(name) {
  const result = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="guided-tour"]');
    const box = panel?.getBoundingClientRect();
    const controls = panel ? [...panel.querySelectorAll('button, a')].filter(e => e.getClientRects().length) : [];
    const bad = controls.filter(element => { const r = element.getBoundingClientRect(); return r.x < 0 || r.right > innerWidth + 1 || r.y < 0 || r.bottom > innerHeight; });
    return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, panel: box ? { x: box.x, top: box.y, bottom: box.bottom, width: box.width } : null, controlsOutsideViewport: bad.map(e => e.textContent) };
  });
  assert.ok(result.documentWidth <= result.width + 1, JSON.stringify(result));
  assert.deepEqual(result.controlsOutsideViewport, []);
  layouts.push({ name, ...result });
}
try {
  await fetch(fixture + '/__visual/mode?value=success');
  await page.goto(base + '/feed');
  await visible(page.getByRole('button', { name: 'Ver 3 passos', exact: true }));
  await shot('welcome-390');
  await page.getByRole('button', { name: 'Explorar sozinho', exact: true }).click();
  await page.reload();
  await visible(page.getByRole('heading', { name: 'Seu Pico.', exact: true }));
  await hidden(page.getByRole('button', { name: 'Ver 3 passos', exact: true }));
  await page.goto(base + '/perfil');
  await page.getByRole('button', { name: 'Guia de 3 passos', exact: true }).click();
  await page.waitForURL('**/arenas');
  await visible(guide.getByRole('button', { name: 'Mostrar onde' }));
  await guide.getByRole('button', { name: 'Mostrar onde' }).click();
  await page.waitForFunction(() => document.querySelector('[data-tour="arena-search"]')?.contains(document.activeElement));
  await fits('arenas-390'); await shot('arenas-390');
  await guide.getByRole('button', { name: 'Expandir tutorial' }).click();
  await page.locator('.arena-list a').first().click();
  await visible(page.locator('[data-tour="arena-follow"][data-tour-highlight]'));
  assert.match(await guide.innerText(), /Nenhuma ação indica presença ao vivo/);
  await guide.getByRole('link', { name: 'Próximo: Pessoas' }).click();
  await visible(page.locator('[data-tour="people-filters"][data-tour-highlight]'));
  await guide.getByRole('button', { name: 'Mostrar onde' }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-tour') === 'people-filters');
  await page.keyboard.press('Enter');
  await guide.getByRole('button', { name: 'Expandir tutorial' }).click();
  await visible(page.locator('[data-tour="people-arena"][data-tour-highlight]'));
  await page.locator('select[data-tour="people-arena"]').selectOption('20000000-0000-4000-8000-000000000001');
  await page.waitForTimeout(100);
  await shot('people-390');
  await guide.getByRole('link', { name: 'Próximo: Meus jogos' }).click();
  await page.waitForURL('**/jogos');
  assert.match(await guide.innerText(), /Registrar não publica no Início/);
  await page.getByRole('button', { name: 'Registrar jogo', exact: true }).click();
  await visible(page.getByRole('button', { name: 'Cancelar', exact: true }));
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await guide.getByRole('button', { name: 'Concluir guia' }).click();
  await visible(page.getByText('GUIA CONCLUÍDO'));
  await shot('complete-390');
  await page.getByRole('button', { name: 'Ficar aqui' }).click();
  await page.goto(base + '/perfil'); await visible(page.getByRole('button', { name: 'Guia de 3 passos', exact: true }));
  await hidden(guide);
  checks.push('optional invitation, dismiss persists, profile replay, all three steps, real arena/person/game targets, filter request, completion persists');
  checks.push('game form opens and closes without a write; zero required social writes');

  await page.getByRole('button', { name: 'Guia de 3 passos', exact: true }).click();
  await page.waitForURL('**/arenas');
  await guide.getByRole('link', { name: 'Próximo: Pessoas' }).click();
  await page.waitForURL('**/descobrir');
  await guide.getByRole('button', { name: 'Pausar tutorial' }).click();
  await hidden(guide);
  await page.goto(base + '/perfil');
  await page.getByRole('button', { name: 'Retomar guia' }).click();
  await page.waitForURL('**/descobrir');
  await visible(guide);
  await page.reload(); await hidden(guide);
  await page.goto(base + '/perfil'); await visible(page.getByRole('button', { name: 'Retomar guia' }));
  await page.getByRole('button', { name: 'Recomeçar', exact: true }).click();
  await page.waitForURL('**/arenas'); await visible(guide);
  await guide.getByRole('button', { name: 'Recolher tutorial' }).click();
  await hidden(guide.getByRole('link', { name: 'Próximo: Pessoas' }));
  await guide.getByRole('button', { name: 'Expandir tutorial' }).click();
  await visible(guide.getByRole('link', { name: 'Próximo: Pessoas' }));
  checks.push('pause/resume/restart, voluntary resume after reload, collapse/expand');

  for (const mode of ['empty', 'error']) {
    await fetch(fixture + '/__visual/mode?value=' + mode);
    await guide.getByRole('link', { name: 'Próximo: Pessoas' }).click();
    await visible(guide.getByRole('link', { name: 'Próximo: Meus jogos' }));
    await shot(mode + '-390');
    await guide.getByRole('link', { name: 'Voltar: Arenas' }).click();
  }
  await fetch(fixture + '/__visual/mode?value=success');
  checks.push('empty catalog and failing reads preserve navigation without fixtures becoming social success');

  for (const [width, height] of [[320,620],[390,844],[430,932],[768,850],[1280,900],[390,500]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    await fits(`${width}x${height}`); await shot(`guide-${width}-${height}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const textStyle = await page.addStyleTag({ content: ':root { font-size: 200% !important; }' });
  await page.evaluate(() => scrollTo(0, 0));
  await fits('text-200'); await shot('text-200');
  await guide.getByRole('button', { name: 'Pausar tutorial' }).focus();
  await page.keyboard.press('Escape'); await hidden(guide);
  await textStyle.evaluate(element => element.remove());
  checks.push('320/390/430/768/1280px, short height, 200% text, keyboard focus and Escape, reduced motion');

  identity = '30000000-0000-4000-8000-000000000099';
  await page.goto(base + '/feed');
  await visible(page.getByRole('button', { name: 'Ver 3 passos', exact: true }));
  signedIn = false; access = false;
  await page.reload(); await visible(page.getByRole('heading', { name: 'Me acha no Pico.', exact: true }));
  await hidden(page.getByRole('navigation'));
  assert.equal(anonymousPrivateReads, 0);
  await page.emulateMedia({ colorScheme: 'light' }); await shot('access-light-390');
  await page.emulateMedia({ colorScheme: 'dark' }); await shot('access-dark-390');
  await page.emulateMedia({ colorScheme: 'light' });
  signedIn = true;
  access = false;
  await page.reload(); await visible(page.getByRole('heading', { name: 'Seu acesso está indisponível.' }));
  await hidden(page.getByRole('button', { name: 'Ver 3 passos', exact: true }));
  access = true; brokenProfile = true;
  await page.reload(); await visible(page.getByRole('heading', { name: 'Não deu para carregar.', exact: true }));
  await hidden(page.getByRole('button', { name: 'Ver 3 passos', exact: true }));
  checks.push('signed-out entry hides social navigation in light and dark themes; new identity, admission denial and failed profile read do not offer tutorial');

  brokenProfile = false;
  await page.reload();
  await page.getByRole('button', { name: 'Ver 3 passos', exact: true }).click();
  await page.waitForURL('**/arenas'); await visible(guide);
  const sibling = await context.newPage();
  await sibling.goto(base + '/feed');
  await sibling.evaluate(id => localStorage.setItem('pico.tour.v1:account:' + id, JSON.stringify({ version: 2, status: 'paused', step: 1 })), identity);
  await hidden(guide); assert.ok(page.url().endsWith('/arenas'));
  await sibling.close();
  checks.push('another tab updates the preference without redirecting or opening the guide');

  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { if (key.startsWith('pico.tour')) throw new DOMException('Denied', 'SecurityError'); return get.call(this, key); };
    Storage.prototype.setItem = function(key, value) { if (key.startsWith('pico.tour')) throw new DOMException('Denied', 'SecurityError'); return set.call(this, key, value); };
  });
  await page.goto(base + '/feed');
  await page.getByRole('button', { name: 'Ver 3 passos', exact: true }).click();
  await page.waitForURL('**/arenas'); await visible(guide);
  await guide.getByRole('link', { name: 'Próximo: Pessoas' }).click();
  await visible(guide.getByRole('link', { name: 'Próximo: Meus jogos' }));
  await guide.getByRole('button', { name: 'Pausar tutorial' }).click(); await hidden(guide);
  checks.push('denied localStorage keeps the guide usable in memory');
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  writeFileSync(`${output}/checks.json`, JSON.stringify({ fixture: true, hosted: false, physicalDevice: false, checks, layouts, writes, errors }, null, 2));
  console.log(JSON.stringify({ checks, layouts: layouts.length, writes, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: '/tmp/pico-onboarding-failure.png' });
  console.error((await page.locator('body').innerText()).slice(0, 6000));
  throw error;
} finally { await fetch(fixture + '/__visual/mode?value=success'); await context.unrouteAll({ behavior: 'wait' }); await browser.close(); }

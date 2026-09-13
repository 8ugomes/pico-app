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
let identity = '30000000-0000-4000-8000-000000000001', access = true, brokenProfile = false;
page.on('pageerror', error => errors.push(error.message));
await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
await context.route('**/api/**', async route => {
  const url = new URL(route.request().url());
  // The institutional welcome is independent of the optional guided tour.
  if (url.pathname === '/api/welcome') return route.fulfill({ json: { data: null } });
  if (route.request().method() !== 'GET') writes.push(url.pathname);
  if (url.pathname === '/api/access') return route.fulfill({ json: { admitted: access, signedIn: true } });
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
  await visible(page.getByRole('button', { name: 'Conhecer o Pico', exact: true }));
  await shot('welcome-390');
  await page.getByRole('button', { name: 'Agora não', exact: true }).click();
  await page.reload();
  await visible(page.getByRole('heading', { name: 'Seu Pico.', exact: true }));
  await hidden(page.getByRole('button', { name: 'Conhecer o Pico', exact: true }));
  await page.goto(base + '/perfil');
  await page.getByRole('button', { name: 'Conhecer o Pico', exact: true }).click();
  await page.waitForURL('**/arenas');
  await visible(guide.getByRole('button', { name: 'Mostrar onde' }));
  await guide.getByRole('button', { name: 'Mostrar onde' }).click();
  await page.waitForFunction(() => document.querySelector('[data-tour="arena-search"]')?.contains(document.activeElement));
  await fits('arenas-390'); await shot('arenas-390');
  await guide.getByRole('button', { name: 'Expandir tutorial' }).click();
  await page.locator('.arena-list a').first().click();
  await visible(page.locator('[data-tour="arena-follow"][data-tour-highlight]'));
  assert.match(await guide.innerText(), /Nenhuma dessas ações indica presença ao vivo/);
  await guide.getByRole('link', { name: 'Próxima: Pessoas' }).click();
  await visible(page.locator('[data-tour="people-filters"][data-tour-highlight]'));
  await guide.getByRole('button', { name: 'Mostrar onde' }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-tour') === 'people-filters');
  await page.keyboard.press('Enter');
  await guide.getByRole('button', { name: 'Expandir tutorial' }).click();
  await visible(page.locator('[data-tour="people-arena"][data-tour-highlight]'));
  const filtered = page.waitForRequest(request => request.url().includes('resource=discover') && request.url().includes('arenaId='));
  await page.getByLabel('Arena acompanhada').selectOption('20000000-0000-4000-8000-000000000001');
  await filtered;
  await shot('people-390');
  await guide.getByRole('link', { name: 'Próxima: Comunidades' }).click();
  await page.locator('[data-tour="community-explore"]').click();
  await page.locator('.community-card-title').first().click();
  await visible(page.locator('[data-tour="community-conditions"][data-tour-highlight]'));
  assert.match(await guide.innerText(), /pedido em análise ainda não libera conteúdo privado/);
  await guide.getByRole('link', { name: 'Próxima: Início' }).click();
  await page.locator('[data-tour="publish"]').click();
  await visible(page.locator('dialog[open]'));
  await hidden(guide);
  const composer = page.locator('dialog[open]');
  await composer.locator('textarea').first().fill('Rascunho local do tutorial.');
  await page.keyboard.press('Escape');
  await visible(guide);
  await page.locator('[data-tour="publish"]').click();
  assert.equal(await page.locator('dialog[open] textarea').first().inputValue(), 'Rascunho local do tutorial.');
  await page.keyboard.press('Escape');
  await guide.getByRole('link', { name: 'Próxima: Meus jogos' }).click();
  await page.getByRole('button', { name: 'Registrar jogo', exact: true }).click();
  await visible(page.locator('dialog[open]')); await hidden(guide);
  await page.keyboard.press('Escape'); await visible(guide);
  await guide.getByRole('link', { name: 'Próxima: Perfil' }).click();
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await visible(guide.getByText(/Seu perfil está em edição/));
  await hidden(guide.getByRole('button', { name: 'Concluir tutorial' }));
  await page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
  await guide.getByRole('button', { name: 'Concluir tutorial' }).click();
  await visible(page.getByText('PASSEIO CONCLUÍDO'));
  await shot('complete-390');
  await page.getByRole('button', { name: 'Ficar no perfil' }).click();
  await page.reload(); await visible(page.getByRole('button', { name: 'Conhecer o Pico', exact: true }));
  await hidden(guide);
  checks.push('optional invitation, dismiss persists, profile replay, all six steps, real arena/person/community targets, filter request, completion persists');
  checks.push('compositor and game dialogs hide guide; Escape and draft preserved; profile editing pauses advancement; zero required social writes');

  await page.getByRole('button', { name: 'Conhecer o Pico', exact: true }).click();
  await page.waitForURL('**/arenas');
  await guide.getByRole('link', { name: 'Próxima: Pessoas' }).click();
  await guide.getByRole('button', { name: 'Pausar tutorial' }).click();
  await hidden(guide);
  await page.goto(base + '/perfil');
  await page.getByRole('button', { name: 'Retomar tutorial' }).click();
  await page.waitForURL('**/descobrir');
  await visible(guide);
  await page.reload(); await hidden(guide);
  await page.goto(base + '/perfil'); await visible(page.getByRole('button', { name: 'Retomar tutorial' }));
  await page.getByRole('button', { name: 'Recomeçar', exact: true }).click();
  await page.waitForURL('**/arenas'); await visible(guide);
  await guide.getByRole('button', { name: 'Recolher tutorial' }).click();
  await hidden(guide.getByRole('link', { name: 'Próxima: Pessoas' }));
  await guide.getByRole('button', { name: 'Expandir tutorial' }).click();
  await visible(guide.getByRole('link', { name: 'Próxima: Pessoas' }));
  checks.push('pause/resume/restart, voluntary resume after reload, collapse/expand');

  for (const mode of ['empty', 'error']) {
    await fetch(fixture + '/__visual/mode?value=' + mode);
    await guide.getByRole('link', { name: 'Próxima: Pessoas' }).click();
    await visible(guide.getByRole('link', { name: 'Próxima: Comunidades' }));
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
  await page.addStyleTag({ content: ':root { font-size: 200% !important; }' });
  await page.evaluate(() => scrollTo(0, 0));
  await fits('text-200'); await shot('text-200');
  await guide.getByRole('button', { name: 'Pausar tutorial' }).focus();
  await page.keyboard.press('Escape'); await hidden(guide);
  checks.push('320/390/430/768/1280px, short height, 200% text, keyboard focus and Escape, reduced motion');

  identity = '30000000-0000-4000-8000-000000000099';
  await page.goto(base + '/feed');
  await visible(page.getByRole('button', { name: 'Conhecer o Pico', exact: true }));
  access = false;
  await page.reload(); await visible(page.getByRole('heading', { name: 'Seu acesso está indisponível.' }));
  await hidden(page.getByRole('button', { name: 'Conhecer o Pico', exact: true }));
  access = true; brokenProfile = true;
  await page.reload(); await visible(page.getByRole('heading', { name: 'Não deu para carregar.', exact: true }));
  await hidden(page.getByRole('button', { name: 'Conhecer o Pico', exact: true }));
  checks.push('new identity has independent preference; admission denial and failed profile read do not offer tutorial');

  brokenProfile = false;
  await page.reload();
  await page.getByRole('button', { name: 'Conhecer o Pico', exact: true }).click();
  await page.waitForURL('**/arenas'); await visible(guide);
  const sibling = await context.newPage();
  await sibling.goto(base + '/feed');
  await sibling.evaluate(id => localStorage.setItem('pico.tour.v1:account:' + id, JSON.stringify({ version: 1, status: 'paused', step: 2 })), identity);
  await hidden(guide); assert.ok(page.url().endsWith('/arenas'));
  await sibling.close();
  checks.push('another tab updates the preference without redirecting or opening the guide');

  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { if (key.startsWith('pico.tour')) throw new DOMException('Denied', 'SecurityError'); return get.call(this, key); };
    Storage.prototype.setItem = function(key, value) { if (key.startsWith('pico.tour')) throw new DOMException('Denied', 'SecurityError'); return set.call(this, key, value); };
  });
  await page.goto(base + '/feed');
  await page.getByRole('button', { name: 'Conhecer o Pico', exact: true }).click();
  await page.waitForURL('**/arenas'); await visible(guide);
  await guide.getByRole('link', { name: 'Próxima: Pessoas' }).click();
  await visible(guide.getByRole('link', { name: 'Próxima: Comunidades' }));
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

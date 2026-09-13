// Explicit local demo build on 3018, without credentials or fixture APIs.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const calls = [], errors = [];
page.setDefaultTimeout(10000);
page.on('pageerror', error => errors.push(error.message));
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith('/api/')) calls.push(url.pathname);
  return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
});
await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));
try {
  await page.goto('http://127.0.0.1:3018/feed');
  await page.getByRole('button', { name: 'Conhecer o Pico', exact: true }).click();
  const guide = page.getByTestId('guided-tour');
  await page.waitForURL('**/arenas');
  await guide.getByRole('link', { name: 'Próxima: Pessoas' }).click();
  await page.locator('[data-tour="people-search"][data-tour-highlight]').waitFor();
  assert.match(await guide.innerText(), /Nesta demonstração, busque por nome, bairro ou esporte/);
  await page.screenshot({ path: 'docs/onboarding-review/demo-people-390.png' });
  for (const name of ['Próxima: Comunidades', 'Próxima: Início', 'Próxima: Meus jogos', 'Próxima: Perfil']) await guide.getByRole('link', { name }).click();
  await guide.getByRole('button', { name: 'Concluir tutorial' }).click();
  await page.getByRole('heading', { name: 'Agora, encontre seu Pico.' }).waitFor();
  const preferences = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('pico.tour'))));
  assert.deepEqual(Object.keys(preferences), ['pico.tour.v1:demo']);
  assert.equal(JSON.parse(preferences['pico.tour.v1:demo']).status, 'complete');
  assert.deepEqual([...new Set(calls)], ['/api/version']);
  assert.deepEqual(errors, []);
  const result = { demo: true, hosted: false, physicalDevice: false, steps: 6, completion: true, adaptedPeopleSearch: true, apiCalls: [...new Set(calls)], errors };
  writeFileSync('docs/onboarding-review/demo-checks.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await context.unrouteAll({ behavior: 'wait' }); await browser.close(); }

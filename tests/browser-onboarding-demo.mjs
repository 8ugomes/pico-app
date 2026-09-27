// Explicit local demo build on 3018, without credentials or fixture APIs.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const output = process.env.PICO_REVIEW_DIR || 'docs/onboarding-review';
mkdirSync(output, { recursive: true });
const calls = [], errors = [];
page.setDefaultTimeout(10000);
page.on('pageerror', error => errors.push(error.message));
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith('/api/')) calls.push(url.pathname);
  return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
});
await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));
try {
  await page.goto((process.env.PICO_DEMO_URL || 'http://127.0.0.1:3018') + '/feed');
  await page.getByRole('button', { name: 'Ver 3 passos', exact: true }).click();
  const guide = page.getByTestId('guided-tour');
  await page.waitForURL('**/arenas');
  await guide.getByRole('link', { name: 'Próximo: Pessoas' }).click();
  await page.locator('[data-tour="people-search"][data-tour-highlight]').waitFor();
  assert.match(await guide.innerText(), /Busque por nome, bairro ou esporte/);
  await page.screenshot({ path: `${output}/demo-people-390.png` });
  await guide.getByRole('link', { name: 'Próximo: Meus jogos' }).click();
  await guide.getByRole('button', { name: 'Concluir guia' }).click();
  await page.getByRole('heading', { name: 'Você já sabe por onde começar.' }).waitFor();
  const preferences = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('pico.tour'))));
  assert.deepEqual(Object.keys(preferences), ['pico.tour.v1:demo']);
  assert.equal(JSON.parse(preferences['pico.tour.v1:demo']).status, 'complete');
  assert.deepEqual([...new Set(calls)], ['/api/version']);
  assert.deepEqual(errors, []);
  const result = { demo: true, hosted: false, physicalDevice: false, steps: 3, completion: true, adaptedPeopleSearch: true, apiCalls: [...new Set(calls)], errors };
  writeFileSync(`${output}/demo-checks.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await context.unrouteAll({ behavior: 'wait' }); await browser.close(); }

// Real built Next UI with loopback API fixtures. No credentials or remote writes.
// Start the configured Next build and tests/helpers/visual-preview.mjs first.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SHARING_BASE_URL || 'http://127.0.0.1:3017';
const fixture = process.env.SHARING_FIXTURE_URL || 'http://127.0.0.1:3002';
const output = process.env.PICO_REVIEW_DIR || '.vercel/sharing-review';
mkdirSync(output, { recursive: true });

for (const value of [base, fixture]) assert.ok(['127.0.0.1', 'localhost'].includes(new URL(value).hostname));

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));

const page = await context.newPage();
page.setDefaultTimeout(15000);
const checks = [], errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
await context.route('**/api/**', async route => {
  const url = new URL(route.request().url());
  requests.push(`${route.request().method()} ${url.pathname}${url.search}`);
  if (url.pathname === '/api/welcome') return route.fulfill({ json: { data: null } });
  return route.fulfill({ response: await route.fetch({ url: fixture + url.pathname + url.search }) });
});

const shareButton = page.getByRole('button', { name: 'Compartilhar comunidade', exact: true });
const dialog = page.getByRole('dialog', { name: 'Compartilhar no seu contexto' });
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
async function prepare() {
  await shareButton.click();
  await dialog.getByLabel('Endereço').waitFor();
}
async function fits(label) {
  const result = await page.evaluate(() => {
    const modal = document.querySelector('dialog[open]');
    const buttons = modal ? [...modal.querySelectorAll('button')].filter(element => element.getClientRects().length) : [];
    return {
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      modalClient: modal?.clientWidth || 0,
      modalScroll: modal?.scrollWidth || 0,
      bodyClient: modal?.querySelector('.dialog-body')?.clientWidth || 0,
      shortControls: buttons.filter(element => element.getBoundingClientRect().height < 44).map(element => element.textContent?.trim()),
    };
  });
  assert.ok(result.document <= result.viewport + 1, `${label}: document overflow ${JSON.stringify(result)}`);
  assert.ok(result.modalScroll <= result.modalClient + 1, `${label}: modal overflow ${JSON.stringify(result)}`);
  if (result.viewport === 320) assert.ok(result.bodyClient >= 250, `${label}: dialog content is too narrow ${JSON.stringify(result)}`);
  assert.deepEqual(result.shortControls, [], `${label}: controls below 44px`);
  checks.push(`${label}: no horizontal overflow and 44px controls`);
}

try {
  await fetch(fixture + '/__visual/mode?value=success');
  await page.goto(base + '/comunidades/turma-do-fim-de-tarde');
  await shareButton.waitFor();
  await prepare();

  const address = dialog.getByLabel('Endereço');
  const canonical = new URL(await address.inputValue());
  assert.equal(canonical.origin, 'https://pico.example');
  assert.equal(canonical.pathname, '/comunidades/turma-do-fim-de-tarde');
  assert.equal(canonical.search, '');
  assert.equal(canonical.hash, '');
  check(await dialog.getByText(/Abrir não acompanha ninguém, não entra em comunidade e não aceita convite/).isVisible(), 'opening a share has no implied social action');
  await fits('light 390');
  await page.screenshot({ path: output + '/community-light-390.png', fullPage: true });

  await dialog.getByRole('button', { name: 'Copiar link', exact: true }).click();
  await dialog.getByText('Link copiado.', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), canonical.href);
  checks.push('copy uses the canonical URL and reports only a copy');

  await dialog.getByRole('button', { name: 'Mostrar QR', exact: true }).click();
  const qr = dialog.getByRole('img', { name: 'QR code para Turma do fim de tarde' });
  await qr.waitFor();
  check((await qr.getAttribute('src'))?.startsWith('data:image/png;base64,'), 'QR is generated as a local data URL');
  check(await dialog.getByText('QR gerado neste aparelho, sem serviço externo.', { exact: true }).isVisible(), 'QR origin is explained');
  await fits('light 390 with QR');
  await page.screenshot({ path: output + '/community-qr-light-390.png', fullPage: true });

  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  check(await shareButton.evaluate(element => element === document.activeElement), 'Escape closes the modal and restores focus');

  await fetch(fixture + '/__visual/mode?value=error');
  await shareButton.click();
  await dialog.getByRole('alert').waitFor();
  await page.screenshot({ path: output + '/community-error-light-390.png', fullPage: true });
  await fetch(fixture + '/__visual/mode?value=success');
  await dialog.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await dialog.getByLabel('Endereço').waitFor();
  checks.push('preparation failure is recoverable without leaving the modal');

  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await dialog.getByRole('button', { name: 'Mostrar QR', exact: true }).click();
  await qr.waitFor();
  const textStyle = await page.addStyleTag({ content: ':root { font-size: 200% !important; }' });
  await fits('dark 320 text 200%');
  await page.screenshot({ path: output + '/community-qr-dark-320-text200.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Ocultar QR', exact: true }).scrollIntoViewIfNeeded();
  await qr.scrollIntoViewIfNeeded();
  check(await qr.isVisible(), 'QR and its control remain reachable with 200% text');
  await page.screenshot({ path: output + '/community-qr-dark-320-text200-scrolled.png' });
  await textStyle.evaluate(element => element.remove());

  await page.setViewportSize({ width: 1280, height: 900 });
  await fits('dark 1280');
  await page.screenshot({ path: output + '/community-qr-dark-1280.png', fullPage: true });

  assert.equal(errors.length, 0, `browser errors: ${errors.join('; ')}`);
  assert.ok(requests.filter(value => value === 'POST /api/shares').length >= 3);
  assert.equal(requests.some(value => /\/api\/(social\/mutate|communities|connections)/.test(value) && value.startsWith('POST ')), false);
  checks.push('share preparation performs no follow, join, invitation acceptance or social mutation');
} catch (error) {
  await page.screenshot({ path: output + '/failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  writeFileSync(output + '/browser.json', JSON.stringify({ checks, errors, requests, fixture: true, remoteValidated: false }, null, 2));
  await browser.close();
  console.log(JSON.stringify({ checks: checks.length, errors: errors.length, requests: requests.length }));
}

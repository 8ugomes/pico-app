// Real Auth and profile on exclusive development; image/network failures are labeled fixtures.
// FLOW_BASE_URL=http://localhost:3016 PLAYWRIGHT_MODULE=<playwright path> PLAYWRIGHT_CHANNEL=chrome
// node --env-file=.env.local --env-file=.env.hosted-admin tests/browser-flow-passwords.mjs
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env, 'hosted-test');
const origin = process.env.FLOW_BASE_URL || 'http://localhost:3016';
assert.equal(new URL(origin).hostname, 'localhost');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const output = 'docs/flow-review'; mkdirSync(output, { recursive: true });
const email = 'pico-flow-' + randomBytes(9).toString('hex') + '@example.com';
const password = randomBytes(22).toString('base64url') + 'Aa9!';
const checks = [], errors = [], layouts = [];
let userId, completed = false, signupCalls = 0;
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));
const page = await context.newPage(); page.setDefaultTimeout(20000);
page.on('pageerror', e => errors.push(e.message));
page.on('request', request => { if (request.url().includes('/auth/v1/signup')) signupCalls++; });
page.on('response', async response => {
  if (response.url().includes('/auth/v1/signup') && response.ok()) {
    const data = await response.json(); userId = data.user?.id ?? data.id;
    if (userId) writeFileSync('.vercel/flow-fixture.json', JSON.stringify({ projectRef: process.env.PICO_PROJECT_REF, userId }), { mode: 0o600 });
  }
});
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
async function shot(name, width = 390, colorScheme = 'light') {
  await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme });
  await page.waitForFunction(() => [...document.images].filter(img => { const r = img.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).every(img => img.complete), { timeout: 15000 });
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check(fits, `${name} fits ${width}px ${colorScheme}`); layouts.push({ name, width, colorScheme, fits });
  await page.screenshot({ path: `${output}/${name}-${width}-${colorScheme}.png`, fullPage: !['arenas', 'feed', 'profile', 'account'].includes(name) });
}
try {
  await page.goto(origin + '/signup');
  await page.getByLabel('Confirmar senha', { exact: true }).waitFor();
  await shot('signup'); await shot('signup', 320, 'dark');
  await page.getByLabel('Como você quer ser chamado?', { exact: true }).fill('Revisão de fluxo');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password + 'x');
  const eye = page.getByRole('button', { name: 'Mostrar senha: Senha', exact: true });
  await eye.focus(); await page.keyboard.press('Enter');
  check(await page.getByLabel('Senha', { exact: true }).getAttribute('type') === 'text', 'keyboard reveals password');
  check(await page.getByLabel('Confirmar senha', { exact: true }).getAttribute('type') === 'password', 'confirmation toggle is independent');
  check(signupCalls === 0, 'eye does not submit');
  await page.getByRole('button', { name: 'Ocultar senha: Senha', exact: true }).click();
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'não coincidem' }).waitFor();
  check(signupCalls === 0, 'mismatch never reaches Auth');
  check(await page.getByLabel('Senha', { exact: true }).inputValue() === password, 'mismatch keeps original input');
  check(await page.getByLabel('Confirmar senha', { exact: true }).evaluate(e => document.activeElement === e && e.getAttribute('aria-invalid') === 'true'), 'mismatch focuses and identifies confirmation');
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.waitForURL('**/perfil');
  check(Boolean(userId), 'matching signup creates one real development account');
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).waitFor();
  checks.push('logout available before profile completion');
  check(!(await page.getByLabel('Bio', { exact: true }).isVisible()), 'optional profile fields start collapsed');
  await shot('setup');
  await page.getByLabel('Nome', { exact: true }).fill('Revisão de fluxo');
  await page.getByLabel('Nome de usuário', { exact: true }).fill('flow_' + randomBytes(5).toString('hex'));
  await page.getByLabel('Esporte principal', { exact: true }).selectOption({ index: 1 });
  const photo = await sharp({ create: { width: 512, height: 512, channels: 3, background: '#CBBBE0' } }).png().toBuffer();
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: photo });
  await page.getByRole('button', { name: 'Confirmar enquadramento', exact: true }).click();
  await page.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
  await page.locator('.mobile-app-header img').waitFor();
  await page.getByRole('button', { name: 'Salvar perfil e entrar', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu Pico.', exact: true }).waitFor();
  await page.locator('.tour-welcome').getByRole('button', { name: 'Agora não', exact: true }).click();
  // Acknowledge only this test user's real institutional notice.
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await page.reload();
  await page.getByRole('link', { name: 'Encontrar minha arena', exact: true }).waitFor();
  await shot('feed');
  await page.getByRole('link', { name: 'Encontrar minha arena', exact: true }).click();
  await page.locator('.arena-card').first().waitFor();
  await shot('arenas'); await shot('arenas', 1280, 'dark');
  const firstArena = await page.locator('.arena-card > a').first().getAttribute('href');
  await page.goto(origin + firstArena);
  await page.locator('.arena-gallery-frame img').waitFor();
  check(await page.locator('.arena-gallery-frame img').evaluate(e => getComputedStyle(e).objectFit === 'contain'), 'gallery preserves full image');
  await shot('arena');
  // Controlled portrait cover: no writes or ownership changes to the real arena.
  const portrait = await sharp({ create: { width: 400, height: 1000, channels: 3, background: '#F2E3B5' } }).png().toBuffer();
  await page.route('**/api/arenas?slug=*', async route => { const r = await route.fetch(); const data = await r.json(); data.data.cover_path = 'flow-fixture-portrait'; await route.fulfill({ response: r, json: data }); });
  await page.route('**/api/media?bucket=entity-media&path=flow-fixture-portrait', route => route.fulfill({ contentType: 'image/png', body: portrait }));
  await page.reload(); await page.locator('.arena-gallery-frame img').waitFor();
  check(await page.locator('.arena-gallery-frame img').evaluate(e => getComputedStyle(e).objectFit === 'contain'), 'team portrait cover preserves full image');
  await shot('portrait-fixture', 320, 'dark');
  await page.unroute('**/api/media?bucket=entity-media&path=flow-fixture-portrait');
  await page.route('**/api/media?bucket=entity-media&path=flow-fixture-portrait', route => route.fulfill({ status: 404 }));
  await page.reload();
  await page.waitForFunction(() => {
    const image = document.querySelector('.arena-gallery-frame img');
    return image?.complete && image.naturalWidth > 0 && image.currentSrc.includes('%2Fimages%2Farenas%2F');
  });
  checks.push('failed team cover recovers a real catalog photo of the same arena');
  await page.unroute('**/api/arenas?slug=*');
  await page.goto(origin + '/perfil');
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).waitFor();
  await page.locator('.profile-v2-panel .feed-empty').waitFor();
  await page.locator('.profile-v2-avatar img').waitFor();
  await shot('profile');
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'profile logout fits enlarged text');
  await page.evaluate(() => document.documentElement.style.fontSize = '');
  const tab = await context.newPage(); await tab.goto(origin + '/feed');
  await tab.getByRole('heading', { name: 'Seu Pico.', exact: true }).waitFor();
  await page.goto(origin + '/conta'); await page.getByRole('button', { name: 'Sair da conta', exact: true }).waitFor();
  await shot('account');
  await page.route('**/auth/v1/logout*', route => route.fulfill({ status: 503, json: { message: 'Controlled failure' } }));
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  // This SDK removes the local session even when remote revocation fails.
  await page.waitForURL('**/login'); await tab.waitForURL('**/login');
  checks.push('remote logout failure still removes local session and protected UI');
  await page.unroute('**/auth/v1/logout*');
  check((await page.request.get(origin + '/api/social/read?resource=profile')).status() === 401, 'real logout denies private reads');
  checks.push('logout discards account in both tabs');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Mostrar senha: Senha', exact: true }).click();
  check(await page.getByLabel('Senha', { exact: true }).inputValue() === password, 'login eye preserves credential');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/perfil'); await page.getByRole('button', { name: 'Editar perfil', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click(); await page.waitForURL('**/login');
  await page.getByLabel('Senha', { exact: true }).waitFor();
  check(await page.getByLabel('Senha', { exact: true }).getAttribute('type') === 'password', 'new login starts with hidden password');
  checks.push('successful profile logout returns to login');
  await shot('login');
  assert.deepEqual(errors, []); completed = true;
} catch (error) {
  await page.screenshot({ path: '.vercel/flow-failure.png', fullPage: true }).catch(() => {});
  console.error((await page.locator('body').innerText()).slice(-2200));
  throw error;
} finally {
  await browser.close();
  if (userId) {
    const files = await admin.storage.from('avatars').list(userId, { limit: 1000 }); assert.equal(files.error, null);
    if (files.data.length) assert.equal((await admin.storage.from('avatars').remove(files.data.map(f => userId + '/' + f.name))).error, null);
    assert.equal((await admin.auth.admin.deleteUser(userId)).error, null);
    unlinkSync('.vercel/flow-fixture.json');
  }
  writeFileSync(output + '/results.json', JSON.stringify({ completed, checks, layouts, runtimeErrors: errors, controlledAccountRemoved: Boolean(userId), realEmailDeliveryTested: false, physicalDevicesTested: false, fixtures: ['portrait cover', 'missing image', 'logout failure'], environment: 'exclusive development' }, null, 2) + '\n');
  console.log(JSON.stringify({ completed, checks: checks.length, cleaned: Boolean(userId) }));
}

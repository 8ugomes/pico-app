// Two controlled development accounts; real Auth, private uploads and profile API.
// node --env-file=.env.local --env-file=.env.hosted-admin tests/hosted-profile-setup.mjs
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env, 'hosted-test');
process.umask(0o077);
const origin = process.env.PROFILE_BASE_URL || 'http://localhost:3024';
assert.equal(new URL(origin).hostname, 'localhost');
const output = process.env.PICO_REVIEW_DIR || '.vercel/profile-setup-review';
mkdirSync(output, { recursive: true });
const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, opts);
const users = [], checks = [], errors = [];
let browser, debugPage, completed = false;
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
function ok(result, label) { check(!result.error, label); return result.data; }
const cookie = user => [...user.jar].map(([k, v]) => k + '=' + v).join('; ');
async function account(label) {
  const email = 'pico-profile-' + randomBytes(8).toString('hex') + '@example.com';
  const password = randomBytes(24).toString('base64url') + 'Aa9!';
  const data = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'controlled account ' + label);
  const jar = new Map();
  const client = createServerClient(url, key, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: entries => entries.forEach(e => e.value ? jar.set(e.name, e.value) : jar.delete(e.name)) } });
  const user = { id: data.user.id, jar, client }; users.push(user);
  writeFileSync('.vercel/profile-setup-fixtures.json', JSON.stringify({ projectRef: process.env.PICO_PROJECT_REF, users: users.map(u => u.id) }));
  ok(await client.auth.signInWithPassword({ email, password }), 'verified session ' + label);
  return user;
}
async function api(user, path, body, status = 200) {
  const r = await fetch(origin + path, { method: body ? 'POST' : 'GET', headers: { Cookie: user ? cookie(user) : '', Origin: origin, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  check(r.status === status, path + ' status ' + status); check(/no-store/.test(r.headers.get('cache-control')), 'private response');
  for (const h of r.headers.getSetCookie()) { const part = h.split(';')[0], at = part.indexOf('='); if (user) user.jar.set(part.slice(0, at), part.slice(at + 1)); }
  return r.json();
}
const own = async user => (await api(user, '/api/social/read?resource=profile')).data.profile;
try {
  const a = await account('A'), b = await account('B');
  const sports = (await api(a, '/api/social/read?resource=sports')).data.sports;
  const draft = { action: 'save_profile', name: 'Perfil de teste', username: 'pf_' + a.id.replaceAll('-', '').slice(0, 12), sportId: sports[0].id, level: 'Iniciante', available: false, bio: '', city: '', neighborhood: '' };
  await api(null, '/api/social/mutate', draft, 401);
  await api(a, '/api/social/mutate', draft, 400);
  check(!(await own(a)).onboardingCompleted, 'missing photo cannot complete API onboarding');
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addCookies([...a.jar].map(([name, value]) => ({ name, value, url: origin, sameSite: 'Lax' })));
  await context.addInitScript(() => localStorage.setItem('pico.install-dismissed', '1'));
  const page = await context.newPage(); debugPage = page; page.setDefaultTimeout(15000); page.on('pageerror', e => errors.push(e.message));
  let profileReads = 0, saveCalls = 0, failSave = false, failAvatar = false;
  page.on('request', r => { if (r.url().includes('/api/social/read?resource=profile')) profileReads++; });
  await page.route('**/api/social/mutate', async route => {
    const body = route.request().postDataJSON();
    if (body.action === 'save_profile') saveCalls++;
    if ((body.action === 'save_profile' && failSave) || (body.action === 'set_avatar' && failAvatar)) return route.fulfill({ status: 503, json: { status: 'error', message: 'Falha controlada. Tente novamente.' } });
    await route.continue();
  });
  await page.goto(origin + '/feed');
  await page.getByRole('heading', { name: 'Seu lugar no Pico', exact: true }).waitFor();
  check(profileReads >= 1 && profileReads <= 2, 'shared initial profile reads: ' + profileReads);
  for (const path of ['/arenas', '/descobrir', '/comunidades']) {
    await page.goto(origin + path); await page.getByRole('heading', { name: 'Seu lugar no Pico', exact: true }).waitFor();
    check(await page.getByTestId('profile-editor').count() === 1, 'direct ' + path + ' requires setup');
  }
  await page.goto(origin + '/conta'); await page.getByRole('button', { name: 'Baixar meus dados', exact: true }).waitFor();
  checks.push('account rights remain available before setup');
  await page.goto(origin + '/feed');
  await page.getByLabel('Nome', { exact: true }).fill(draft.name);
  await page.getByLabel('Nome de usuário', { exact: true }).fill(draft.username);
  await page.getByLabel('Esporte principal', { exact: true }).selectOption(draft.sportId);
  await page.getByLabel('Bio', { exact: true }).fill('Um perfil de teste, com o meu jeito.');
  await page.getByLabel('Cidade', { exact: true }).fill('São Paulo');
  await page.getByRole('button', { name: 'Salvar perfil e entrar', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'confirme sua foto' }).waitFor();
  check(saveCalls === 0, 'form explains photo requirement before sending');
  const photo = await sharp({ create: { width: 700, height: 500, channels: 3, background: '#CBBBE0' } }).png().toBuffer();
  await page.locator('input[type=file]').setInputFiles({ name: 'perfil-teste.png', mimeType: 'image/png', buffer: photo });
  await page.getByRole('dialog', { name: 'Ajustar foto', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Confirmar enquadramento', exact: true }).click();
  await page.getByRole('dialog', { name: 'Ajustar foto', exact: true }).waitFor({ state: 'hidden' });
  failAvatar = true;
  await page.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Falha controlada' }).waitFor();
  check(!(await own(a)).avatarPath, 'failed avatar confirmation never marks photo saved');
  failAvatar = false;
  await page.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
  await page.locator('.mobile-app-header img').waitFor();
  check(await page.getByLabel('Nome', { exact: true }).inputValue() === draft.name, 'avatar refresh preserves name draft');
  check(await page.getByLabel('Bio', { exact: true }).inputValue() === 'Um perfil de teste, com o meu jeito.', 'avatar refresh preserves bio draft');
  const withPhoto = await own(a);
  assert.equal(new URL(await page.locator('.mobile-app-header img').getAttribute('src'), origin).searchParams.get('path'), new URL(withPhoto.avatar, origin).searchParams.get('path')); checks.push('header uses confirmed own avatar path');
  const bytes = await fetch(origin + withPhoto.avatar, { headers: { Cookie: cookie(a) } });
  const metadata = await sharp(Buffer.from(await bytes.arrayBuffer())).metadata();
  check(metadata.format === 'webp' && metadata.width === metadata.height && !metadata.exif, 'real private upload is normalized and cropped');
  await api(b, '/api/social/mutate', { action: 'set_avatar', path: withPhoto.avatarPath }, 400);
  failSave = true;
  await page.getByRole('button', { name: 'Salvar perfil e entrar', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Falha controlada' }).waitFor();
  check(await page.getByLabel('Bio', { exact: true }).inputValue() === 'Um perfil de teste, com o meu jeito.', 'failed profile save keeps draft');
  for (const [width, colorScheme] of [[390, 'light'], [320, 'dark'], [1280, 'light']]) {
    await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'setup fits ' + width + ' ' + colorScheme);
    await page.screenshot({ path: output + '/setup-' + width + '-' + colorScheme + '.png', fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ colorScheme: 'light' });
  failSave = false;
  await page.getByRole('button', { name: 'Salvar perfil e entrar', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu Pico.', exact: true }).waitFor();
  const saved = await own(a); check(saved.onboardingCompleted && saved.avatar && saved.city === 'São Paulo', 'confirmed profile opens feed with personal details');
  await page.getByRole('heading', { name: 'Você entrou na comunidade oficial do Pico.', exact: true }).waitFor();
  checks.push('institutional welcome comes after profile completion');
  await page.reload(); await page.getByRole('heading', { name: 'Seu Pico.', exact: true }).waitFor();
  check(await page.getByTestId('profile-editor').count() === 0, 'completed account does not restart onboarding');
  const tab = await context.newPage(); await tab.goto(origin + '/feed'); await tab.locator('.mobile-app-header img').waitFor();
  await page.goto(origin + '/perfil'); await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await page.getByLabel('Bio', { exact: true }).fill('DRAFT SURVIVES PHOTO REMOVAL');
  await page.getByText('Alterar foto', { exact: true }).click();
  await page.getByRole('button', { name: 'Remover foto atual', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.mobile-app-header img'));
  await tab.getByRole('heading', { name: 'Seu lugar no Pico', exact: true }).waitFor();
  check(await page.getByLabel('Bio', { exact: true }).inputValue() === 'DRAFT SURVIVES PHOTO REMOVAL', 'removing photo preserves open profile draft');
  checks.push('other tab refreshes photo and social setup requirement');
  await tab.close();
  await context.clearCookies(); await context.addCookies([...b.jar].map(([name, value]) => ({ name, value, url: origin, sameSite: 'Lax' })));
  await page.reload(); await page.getByRole('heading', { name: 'Seu lugar no Pico', exact: true }).waitFor();
  check(await page.getByLabel('Bio', { exact: true }).inputValue() === '', 'account switch discards prior profile draft');
  check(await page.locator('.mobile-app-header img').count() === 0, 'account switch does not inherit avatar');
  check(errors.length === 0, 'no browser runtime errors');
  completed = true;
} catch (error) {
  if (debugPage) {
    await debugPage.screenshot({ path: output + '/failure.png', fullPage: true }).catch(() => {});
    console.error((await debugPage.locator('body').innerText()).slice(-3000));
  }
  throw error;
} finally {
  await browser?.close();
  for (const user of users) {
    const files = ok(await admin.storage.from('avatars').list(user.id, { limit: 1000 }), 'list controlled photos');
    if (files.length) ok(await admin.storage.from('avatars').remove(files.map(f => user.id + '/' + f.name)), 'remove controlled photos');
    ok(await admin.auth.admin.deleteUser(user.id), 'remove controlled account');
  }
  writeFileSync(output + '/results.json', JSON.stringify({ completed, checks, runtimeErrors: errors, controlledAccounts: users.length, cleaned: true, productionMutated: false, physicalPhoneTested: false }, null, 2));
  console.log(JSON.stringify({ completed, checks: checks.length, cleaned: users.length }));
}

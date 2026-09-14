// Connected development UI only, using the guarded hosted-test fixture.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const origin = 'http://localhost:3002';
const fixture = JSON.parse(readFileSync('.vercel/cycle9-fixture.json', 'utf8'));
const owner = fixture.users.find(user => user.label === 'owner-a');
assert.ok(owner?.cookies?.length);
const output = '.vercel/arena-played-review'; mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const own = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await own.addCookies(owner.cookies.map(({ name, value }) => ({ name, value, url: origin })));
const page = await own.newPage();
const arenaUrl = origin + '/arenas/r7-academia';
let arenaId;
async function finishControlledProfile(target) {
  const save = target.getByRole('button', { name: 'Salvar perfil e entrar' });
  if (await save.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false)) {
    await target.getByRole('combobox', { name: 'Esporte principal' }).selectOption({ label: 'Futevôlei' });
    await save.click();
  }
}
try {
  await page.goto(arenaUrl);
  await finishControlledProfile(page);
  const details = await page.request.get(origin + '/api/arenas?slug=r7-academia');
  arenaId = (await details.json()).data.id;
  await page.request.post(origin + '/api/activity', { headers: { Origin: origin }, data: { action: 'set_played_arena_mark', arenaId, marked: false } });
  await page.reload();
  const welcome = page.getByRole('button', { name: 'Entendi', exact: true });
  if (await welcome.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false)) await welcome.click();
  await page.screenshot({ path: `${output}/arena-first.png`, fullPage: true });
  await page.getByRole('button', { name: 'Marcar “Já joguei”' }).waitFor({ timeout: 10000 });
  for (const [width, scheme] of [[320, 'light'], [390, 'dark'], [1280, 'light']]) {
    await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme: scheme });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.getByRole('button', { name: 'Marcar “Já joguei”' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/arena-${width}-${scheme}.png` });
  }
  await page.getByRole('button', { name: 'Marcar “Já joguei”' }).click();
  await page.getByText('Arena marcada em seu perfil. Outras pessoas podem ver esta declaração.').waitFor();
  await page.goto(origin + '/perfil');
  await page.getByRole('tab', { name: 'Meus Picos' }).click();
  await page.getByRole('heading', { name: 'Já joguei' }).waitFor();
  await page.getByRole('link', { name: 'R7 Academia' }).waitFor();
  await page.screenshot({ path: `${output}/profile-390-dark.png`, fullPage: true });
  console.log('Connected arena mark appears in the profile without a post.');
} finally {
  if (arenaId) await page.request.post(origin + '/api/activity', { headers: { Origin: origin }, data: { action: 'set_played_arena_mark', arenaId, marked: false } });
  await browser.close();
}

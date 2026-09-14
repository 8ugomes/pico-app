// Exclusive development fixture only: visually verify revocation when an arena is hidden.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';

const environment = await assertRemoteIdentity(process.env, 'hosted-test');
const origin = 'http://localhost:3002';
const fixture = JSON.parse(readFileSync('.vercel/cycle9-fixture.json', 'utf8'));
assert.equal(fixture.ref, environment.projectRef);
const owner = fixture.users.find(user => user.label === 'owner-a');
const arenaId = fixture.arenas[0];
assert.ok(owner?.cookies?.length && arenaId);
const admin = createClient(environment.url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
async function arena(values) {
  const result = await admin.from('arenas').update(values).eq('id', arenaId).select('id').single();
  if (result.error || result.data?.id !== arenaId) throw Error('Controlled arena update failed');
}
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
await context.addCookies(owner.cookies.map(({ name, value }) => ({ name, value, url: origin })));
const page = await context.newPage();
mkdirSync('.vercel/arena-played-review', { recursive: true });
try {
  await arena({ is_demo: false, is_public: true });
  const mark = await page.request.post(origin + '/api/activity', { headers: { Origin: origin }, data: { action: 'set_played_arena_mark', arenaId, marked: true } });
  assert.equal(mark.status(), 200);
  await arena({ is_public: false });
  await page.goto(origin + '/conta');
  const heading = page.getByRole('heading', { name: 'Declarações “Já joguei”' });
  await heading.waitFor();
  const section = heading.locator('..');
  await section.getByText('Fora do perfil').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  const remove = section.getByRole('button', { name: 'Remover declaração de Arena C9 editada' });
  await remove.scrollIntoViewIfNeeded();
  await remove.evaluate(element => window.scrollTo(0, Math.max(0, element.getBoundingClientRect().top + window.scrollY - 380)));
  await page.screenshot({ path: '.vercel/arena-played-review/hidden-account-320.png' });
  await remove.click();
  await section.getByText('Declaração removida.').waitFor();
  const owned = await page.request.get(origin + '/api/activity?kind=played-own');
  assert.equal(owned.status(), 200);
  assert.equal((await owned.json()).data.some(item => item.id === arenaId), false);
  console.log('Hidden arena declaration removable from account at 320px.');
} finally {
  await page.request.post(origin + '/api/activity', { headers: { Origin: origin }, data: { action: 'set_played_arena_mark', arenaId, marked: false } });
  await arena({ is_demo: true, is_public: true });
  await browser.close();
}

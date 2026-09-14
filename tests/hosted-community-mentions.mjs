// Controlled development-only smoke; creates and removes its own identities, group and posts.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import sharp from 'sharp';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env, 'hosted-test');
process.umask(0o077);
const origin = process.env.PICO_HOSTED_ORIGIN || 'http://localhost:3002';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const users = [], groups = [], posts = [], avatars = [], checks = [];
const ledger = '.vercel/community-mentions-fixture.json';
if (existsSync(ledger)) throw Error('Tracked mention fixtures already exist. Inspect and clean them first.');
mkdirSync('.vercel/mentions-review', { recursive: true });
const track = () => writeFileSync(ledger, JSON.stringify({ projectRef: process.env.PICO_PROJECT_REF, users: users.map(u => u.id), groups, posts, avatars }), { mode: 0o600 });
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
const ok = (result, label) => { check(!result.error, label + (result.error ? `: ${result.error.code}` : '')); return result.data; };
async function user(name, username) {
  const email = 'pico-mention-' + randomBytes(6).toString('hex') + '@example.com';
  const password = randomBytes(20).toString('base64url') + 'aA9!';
  const created = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'create controlled identity');
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
    getAll: () => [...jar].map(([key, value]) => ({ name: key, value })),
    setAll: values => values.forEach(v => v.value ? jar.set(v.name, v.value) : jar.delete(v.name)),
  } });
  const account = { id: created.user.id, name, username, jar, client, email };
  users.push(account); track();
  ok(await client.auth.signInWithPassword({ email, password }), 'real login');
  ok(await client.from('profiles').update({ display_name: name, username, onboarding_completed: true }).eq('id', account.id), 'controlled profile');
  const sport = ok(await admin.from('sports').select('id').limit(1).single(), 'controlled sport lookup');
  ok(await admin.from('player_sports').insert({ player_id: account.id, sport_id: sport.id, level: 'Iniciante', is_primary: true }), 'controlled primary sport');
  const avatar = account.id + '/' + randomUUID() + '.webp';
  const pixels = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#F2E3B5' } }).webp().toBuffer();
  ok(await admin.storage.from('avatars').upload(avatar, pixels, { contentType: 'image/webp' }), 'controlled avatar upload');
  avatars.push(avatar); track();
  ok(await admin.from('media_assets').insert({ path: avatar, player_id: account.id, bucket: 'avatars', ready: true }), 'controlled avatar registration');
  ok(await admin.from('profiles').update({ avatar_path: avatar }).eq('id', account.id), 'controlled avatar link');
  return account;
}
async function api(account, path, body, status = 200) {
  const response = await fetch(origin + path, { method: body ? 'POST' : 'GET', headers: {
    Origin: origin, Cookie: account ? [...account.jar].map(([key, value]) => key + '=' + value).join('; ') : '', 'Content-Type': 'application/json',
  }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  check(response.status === status, path.split('?')[0] + ' status ' + status);
  check(/no-store/.test(response.headers.get('cache-control')), 'private response');
  for (const header of response.headers.getSetCookie()) {
    const part = header.split(';')[0], at = part.indexOf('=');
    if (account) account.jar.set(part.slice(0, at), part.slice(at + 1));
  }
  return (await response.json()).data;
}
const publication = (key, group, people = [], everyone = false, body = 'Vamos para a areia?') => ({
  action: 'publish', key, body, imagePath: null, audience: 'private', groups: [group],
  mentionCommunity: group, mentionPeople: people, mentionEveryone: everyone,
});
let browser;
try {
  const ana = await user('Ana de teste', 'ana_mencao'), bia = await user('Bia de teste', 'bia_mencao'), caio = await user('Caio de teste', 'caio_mencao');
  const group = await api(ana, '/api/communities', { action: 'create', data: { name: 'Grupo temporário de menções', description: '', sports: [], visibility: 'private', entry_mode: 'open' } });
  groups.push(group.id); track();
  await api(bia, '/api/communities', { action: 'membership', id: group.id, memberAction: 'join' });
  await api(caio, '/api/communities', { action: 'membership', id: group.id, memberAction: 'join' });
  const candidates = await api(ana, `/api/communities?kind=mentions&id=${group.id}&search=bia`);
  check(candidates.length === 1 && candidates[0].id === bia.id, 'candidate search is scoped to active group member');
  check((await api(ana, `/api/communities?kind=mentions&id=${randomUUID()}`, undefined, 403)) === undefined, 'foreign group search denied');
  const key = randomUUID();
  const individual = await api(ana, '/api/posts', publication(key, group.id, [bia.id]));
  posts.push(individual); track();
  check(individual === await api(ana, '/api/posts', publication(key, group.id, [bia.id])), 'retry keeps canonical post');
  check((await api(bia, '/api/notifications')).items.filter(item => item.post_id === individual).length === 1, 'individual recipient notified once');
  check((await api(caio, '/api/notifications')).items.filter(item => item.post_id === individual).length === 0, 'other member not individually notified');
  const inline = await api(ana, '/api/posts', publication(randomUUID(), group.id, [bia.id], false, 'Bora com @bia_mencao amanhã?'));
  posts.push(inline); track();
  check((await admin.from('posts').select('body').eq('id', inline).single()).data?.body === 'Bora com @bia_mencao amanhã?', 'inline mention stays at cursor position');
  check((await api(bia, '/api/notifications')).items.filter(item => item.post_id === inline).length === 1, 'inline mention notifies once');
  await api(ana, '/api/posts', publication(key, group.id, [caio.id]), 409);
  const all = await api(ana, '/api/posts', publication(randomUUID(), group.id, [], true, 'Encontro da comunidade'));
  posts.push(all); track();
  check((await api(bia, '/api/notifications')).items.some(item => item.post_id === all && item.kind === 'community_mention_all'), '@todos reaches Bia');
  check((await api(caio, '/api/notifications')).items.some(item => item.post_id === all && item.kind === 'community_mention_all'), '@todos reaches Caio');
  check((await api(ana, '/api/notifications')).items.every(item => item.post_id !== all), 'no self notice');
  if (process.env.PLAYWRIGHT_MODULE) {
    const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.addCookies([...ana.jar].map(([name, value]) => ({ name, value, url: origin })));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/comunidades/' + group.slug);
    await page.getByRole('button', { name: 'O que aconteceu na areia?' }).click();
    const draft = page.getByRole('textbox', { name: 'Texto da publicação' });
    await draft.fill('Vamos com @bi');
    await page.getByRole('button', { name: /Bia de teste.*@bia_mencao/ }).click();
    check((await draft.inputValue()).includes('@bia_mencao'), 'composer inserts chosen person in text');
    check(await page.getByText(/Aviso para @bia_mencao/).isVisible(), 'composer previews individual recipient');
    for (const [theme, width] of [['light', 390], ['dark', 320], ['light', 1280]]) {
      await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme: theme });
      const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].map(element => ({ tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', right: Math.round(element.getBoundingClientRect().right) })).filter(element => element.right > innerWidth + 1).slice(0, 12) }));
      await page.screenshot({ path: `.vercel/mentions-review/composer-${theme}-${width}.png`, fullPage: true });
      if (layout.document > width + 1) console.log('Composer overflow', layout);
      check(layout.document <= width + 1, `composer fits ${theme} ${width}`);
    }
    await context.close();
    const inboxContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await inboxContext.addCookies([...bia.jar].map(([name, value]) => ({ name, value, url: origin })));
    const inboxPage = await inboxContext.newPage();
    inboxPage.on('pageerror', error => errors.push(error.message));
    await inboxPage.goto(origin + '/notificacoes');
    await inboxPage.getByText('marcou @todos').waitFor();
    await inboxPage.locator('.notification-row').filter({ hasText: 'marcou @todos' }).getByRole('link', { name: 'Grupo temporário de menções' }).click();
    await inboxPage.waitForURL('**/publicacoes/' + all);
    check(inboxPage.url().includes('/publicacoes/' + all), 'mention notification opens the post');
    check(errors.length === 0, 'browser has no JavaScript errors');
    await inboxContext.close();
  }
  writeFileSync('.vercel/mentions-review/hosted.json', JSON.stringify({ checks }, null, 2));
  console.log('Hosted mention checks passed:', checks.length);
} catch (error) { console.error('Mention smoke failed:', error); throw error; } finally {
  await browser?.close();
  if (posts.length) ok(await admin.from('posts').delete().in('id', posts), 'tracked posts cleanup');
  if (groups.length) ok(await admin.from('communities').delete().in('id', groups), 'tracked group cleanup');
  if (avatars.length) ok(await admin.storage.from('avatars').remove(avatars), 'tracked avatar files cleanup');
  for (const account of users) ok(await admin.auth.admin.deleteUser(account.id), 'tracked identity cleanup');
  unlinkSync(ledger);
}

// Runs only on exclusive development. Creates/cleans tracked test identities and groups.
// No sports/profile completion RPC: test accounts never join the global community.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env, 'hosted-test');
process.umask(0o077);
const origin = 'http://localhost:3002';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const users = [], groups = [], checks = [], output = '.vercel/notifications-review';
const ledger = '.vercel/notifications-fixture.json';
if (existsSync(ledger)) throw Error('Tracked notification fixtures already exist; clean them before another run.');
mkdirSync(output, { recursive: true });
const track = () => writeFileSync(ledger, JSON.stringify({ projectRef: process.env.PICO_PROJECT_REF, users: users.map(u => u.id), groups }), { mode: 0o600 });
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
const ok = (r, label) => { check(!r.error, label + (r.error ? ': ' + r.error.code : '')); return r.data; };
async function user(name) {
  const email = 'pico-notify-' + randomBytes(6).toString('hex') + '@example.com';
  const password = randomBytes(20).toString('base64url') + 'aA9!';
  const created = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'controlled identity');
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: values => values.forEach(v => v.value ? jar.set(v.name, v.value) : jar.delete(v.name)),
  } });
  const account = { id: created.user.id, name, email, jar, client };
  users.push(account); track();
  ok(await client.auth.signInWithPassword({ email, password }), 'real Auth login');
  ok(await client.from('profiles').update({ display_name: name, onboarding_completed: true }).eq('id', account.id), 'controlled profile');
  return account;
}
async function api(account, path = '/api/notifications', body, status = 200, from = origin) {
  const r = await fetch(origin + path, { method: body ? 'POST' : 'GET', headers: {
    Origin: from, Cookie: account ? [...account.jar].map(([k,v]) => k + '=' + v).join('; ') : '', 'Content-Type': 'application/json',
  }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  check(r.status === status, path.split('?')[0] + ' status ' + status);
  check(/no-store/.test(r.headers.get('cache-control')), 'private response');
  for (const h of r.headers.getSetCookie()) { const part = h.split(';')[0], at = part.indexOf('='); if (account) account.jar.set(part.slice(0, at), part.slice(at + 1)); }
  return (await r.json()).data;
}
async function join(account, g, action = 'join', target) {
  return api(account, '/api/communities', { action: 'membership', id: g.id, memberAction: action, ...(target ? { target: target.id } : {}) });
}
async function group(account, entry_mode) {
  const g = await api(account, '/api/communities', { action: 'create', data: { name: 'Turma da areia · teste de notificações', description: 'Comunidade temporária para verificação.', sports: [], visibility: 'private', entry_mode } });
  groups.push(g.id); track(); return g;
}
let browser;
try {
  const alice = await user('Ana · teste'), bob = await user('Bruno · teste'), carol = await user('Camila · teste');
  const g = await group(alice, 'open');
  await api(null, '/api/notifications', undefined, 401);
  await api(alice, '/api/notifications?before=bad', undefined, 400);
  await api(alice, '/api/notifications?recipient_id=' + bob.id, undefined, 400);
  await api(alice, '/api/notifications', { action: 'read-all' }, 403, 'https://untrusted.example');
  await api(alice, '/api/notifications', { action: 'read-all', recipient_id: bob.id }, 400);
  await api(alice, '/api/notifications', { action: 'read', ids: [] }, 400);
  await join(bob, g); await join(bob, g);
  let inbox = await api(alice);
  check(inbox.unreadCount === 1 && inbox.items[0].actor_name === bob.name, 'confirmed join produces one named notification');
  check((await api(bob)).items.length === 0, 'no self notification');
  check((await api(carol)).items.length === 0, 'outsider inbox empty');
  await api(carol, '/api/notifications', { action: 'read', ids: [inbox.items[0].id] });
  check((await api(alice)).unreadCount === 1, 'foreign write cannot mark recipient inbox');
  check(Boolean((await bob.client.from('notifications').insert({ recipient_id: alice.id, actor_id: carol.id, community_id: g.id })).error), 'direct forged insert denied');
  check(ok(await carol.client.from('notifications').select('*'), 'direct RLS read').length === 0, 'RLS hides private inbox');
  await join(carol, g);
  check((await api(alice)).unreadCount === 2, 'all existing active members receive join');
  check((await api(bob)).unreadCount === 1, 'second recipient receives join');

  if (process.env.PLAYWRIGHT_MODULE) {
    const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.addCookies([...alice.jar].map(([name,value]) => ({ name, value, url: origin })));
    const page = await context.newPage(), errors = [], layouts = [];
    page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(15000);
    await page.goto(origin + '/notificacoes');
    await page.getByRole('heading', { name: 'Notificações', exact: true }).waitFor();
    await page.locator('.notification-row').nth(1).waitFor();
    check(await page.getByRole('link', { name: 'Notificações, 2 não lidas', exact: true, includeHidden: true }).count() === 2, 'sino and desktop tab expose unread count');
    check((await api(alice)).unreadCount === 2, 'opening tab does not mark as read');
    for (const [theme,width,scale] of [['light',390,1],['dark',320,1],['light',1280,1],['light',320,2]]) {
      await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme: theme });
      await page.evaluate(async scale => { document.documentElement.style.fontSize = 16 * scale + 'px'; await document.fonts.ready; }, scale);
      const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, main: document.querySelector('main').getBoundingClientRect().width }));
      check(layout.document <= width + 1, 'no horizontal overflow ' + theme + ' ' + width + ' ' + scale);
      await page.screenshot({ path: `${output}/${theme}-${width}-${scale}.png`, fullPage: true });
      layouts.push({ theme, width, scale, ...layout });
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.setViewportSize({ width: 390, height: 844 });
    let fail = true, writes = 0;
    await context.route('**/api/notifications', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      writes++;
      if (fail) { fail = false; return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Falha controlada.' }) }); }
      return route.continue();
    });
    await page.getByRole('button', { name: /^Marcar como lida:/ }).first().click();
    await page.getByRole('alert').filter({ hasText: 'Não foi possível confirmar' }).waitFor();
    check((await api(alice)).unreadCount === 2, 'failure preserves unread state');
    const before = writes;
    await page.getByRole('button', { name: /^Marcar como lida:/ }).first().evaluate(e => { e.click(); e.click(); });
    await page.getByRole('link', { name: 'Notificações, 1 não lida', exact: true }).first().waitFor();
    check(writes === before + 1, 'double click sends once');
    await page.getByRole('button', { name: 'Marcar todas como lidas', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.notification-unread').length === 0);
    await page.reload(); await page.locator('.notification-row').nth(1).waitFor();
    check(await page.locator('.notification-unread').count() === 0, 'read state survives reload');
    await page.locator('.notification-content p a').first().click();
    await page.waitForURL('**/comunidades/' + g.slug);
    check(true, 'notification opens its community');
    check(errors.length === 0, 'browser has no JavaScript errors');
    writeFileSync(output + '/browser.json', JSON.stringify({ layouts, errors }, null, 2));
    await context.close();
  }
  const approval = await group(alice, 'approval');
  await join(bob, approval);
  const before = (await api(alice)).items.length;
  await join(alice, approval, 'approve', bob);
  check((await api(alice)).items.length === before + 1, 'approval notification in hosted database');
  const inviteGroup = await group(alice, 'invite');
  const invitation = await api(alice, '/api/communities', { action: 'invite', id: inviteGroup.id, email: bob.email });
  await api(bob, '/api/communities', { action: 'accept', token: invitation.token });
  check((await api(alice)).items.length === before + 2, 'accepted invitation notification in hosted database');
  ok(await alice.client.from('blocks').insert({ blocked_id: bob.id }), 'controlled block');
  check(!(await api(alice)).items.some(n => n.actor_name === bob.name), 'current block conceals actor notifications');
  await join(carol, g, 'leave');
  check((await api(carol)).items.length === 0, 'departed recipient inbox is cleared');
  console.log(process.env.PLAYWRIGHT_MODULE ? 'Notification API and browser checks passed:' : 'Notification API checks passed:', checks.length);
} finally {
  await browser?.close();
  if (groups.length) ok(await admin.from('communities').delete().in('id', groups), 'tracked communities cleanup');
  for (const account of users) ok(await admin.auth.admin.deleteUser(account.id), 'tracked identities cleanup');
  unlinkSync(ledger);
  writeFileSync(output + '/hosted.json', JSON.stringify({ checks }, null, 2));
}

// Real Auth/Data API/Next HTTP, only on the exclusive development project.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env, 'hosted-test');
process.umask(0o077);
const origin = 'http://localhost:3002';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const users = [], groups = [], checks = [];
let completed = false;
mkdirSync('.vercel/reposts-review', { recursive: true });
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
function ok(result, label) { check(!result.error, label + (result.error ? ': ' + result.error.code : '')); return result.data; }
function sql(query) {
  const result = spawnSync('npx', ['--yes', 'supabase@2.117.0', 'db', 'query', '--linked', query, '--workdir', '.vercel/db-development'], { encoding: 'utf8', timeout: 60000, env: process.env });
  if (result.status) throw Error('Controlled development SQL failed');
}
async function user(label) {
  const email = `pico-repost-${randomBytes(6).toString('hex')}@example.com`, password = randomBytes(20).toString('base64url') + 'aA9!';
  const created = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'controlled identity');
  const jar = new Map();
  const client = createServerClient(url, key, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: entries => entries.forEach(e => e.value ? jar.set(e.name, e.value) : jar.delete(e.name)) } });
  const account = { id: created.user.id, username: 'rp_' + created.user.id.replaceAll('-', '').slice(0, 14), name: label, jar, client };
  users.push(account);
  writeFileSync('.vercel/reposts-fixture.json', JSON.stringify({ projectRef: process.env.PICO_PROJECT_REF, users: users.map(u => u.id), groups }), { mode: 0o600 });
  ok(await client.auth.signInWithPassword({ email, password }), 'real password login');
  ok(await client.from('profiles').update({ display_name: label, username: account.username, onboarding_completed: true }).eq('id', account.id), 'test profile');
  return account;
}
async function api(account, path, body, expected = 200, from = origin) {
  const response = await fetch(origin + path, { method: body ? 'POST' : 'GET', headers: { Origin: from, Cookie: account ? [...account.jar].map(([k,v]) => k + '=' + v).join('; ') : '', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  check(response.status === expected, path.split('?')[0] + ' HTTP expected ' + expected + ', received ' + response.status);
  check(/no-store/.test(response.headers.get('cache-control')), 'private HTTP response');
  for (const header of response.headers.getSetCookie()) { const part = header.split(';')[0], at = part.indexOf('='); if (account) account.jar.set(part.slice(0, at), part.slice(at + 1)); }
  return (await response.json()).data;
}
const act = (a, id, reposted = true, status) => api(a, '/api/posts', { action: 'repost', id, reposted }, status);
const posts = async (a, query = '') => (await api(a, '/api/posts' + query)).posts;
try {
  const author = await user('Autora de teste'), actor = await user('Pessoa que republica'), follower = await user('Pessoa que acompanha'), outsider = await user('Pessoa fora do grupo');
  console.log('Four controlled identities ready; verifying reposts');
  const group = ok(await author.client.rpc('create_community', { p_data: { name: 'Grupo privado de teste', description: '', rules: '', sports: [], visibility: 'private', entry_mode: 'open' } }), 'private group');
  groups.push(group.id);
  for (const person of [actor, follower]) ok(await person.client.rpc('community_membership', { p_id: group.id, p_action: 'join' }), 'controlled membership');
  for (const person of [follower, outsider]) ok(await person.client.from('connections').insert({ followed_id: actor.id }), 'follower relationship');
  const publicId = ok(await author.client.rpc('publish_post', { p_key: randomUUID(), p_body: 'Relato público para testar republicação.' }), 'public original');
  const privateId = ok(await author.client.rpc('publish_post', { p_key: randomUUID(), p_body: 'Relato privado para testar republicação.', p_audience: 'private', p_groups: [group.id] }), 'private original');
  await api(null, '/api/posts', { action: 'repost', id: publicId, reposted: true }, 401);
  await api(actor, '/api/posts', { action: 'repost', id: publicId, reposted: true }, 403, 'https://untrusted.example');
  await api(actor, '/api/posts', { action: 'repost', id: publicId, reposted: 'true' }, 400);
  await api(actor, '/api/posts', { action: 'repost', id: publicId, reposted: true, player_id: outsider.id }, 400);
  await act(author, publicId, true, 403); await act(outsider, privateId, true, 403);
  check(Boolean((await actor.client.from('post_reposts').insert({ post_id: publicId, player_id: outsider.id })).error), 'forged direct write rejected');
  await Promise.all([act(actor, publicId), act(actor, publicId)]);
  const rows = ok(await actor.client.from('post_reposts').select('created_at').eq('post_id', publicId), 'read own repost');
  check(rows.length === 1, 'concurrent requests produce one reference');
  await act(actor, publicId);
  check(ok(await actor.client.from('post_reposts').select('created_at').eq('post_id', publicId), 'read retry')[0].created_at === rows[0].created_at, 'retry does not bump timestamp');
  let read = (await posts(follower)).find(p => p.id === publicId);
  check(read.repost.player_id === actor.id && read.author_id === author.id, 'follower sees actor and original author');
  await act(actor, privateId);
  check((await posts(follower)).find(p => p.id === privateId).repost.player_id === actor.id, 'member follower sees private repost');
  check(!(await posts(outsider)).some(p => p.id === privateId), 'outsider follower never receives private original');
  check(!(await posts(outsider, '?author=' + actor.id)).some(p => p.id === privateId), 'private repost hidden in profile');
  check((await posts(follower, '?community=' + group.id)).find(p => p.id === privateId).repost === null, 'wall retains original');
  check((await posts(follower, '?post=' + publicId))[0].repost === null, 'permalink remains original');
  ok(await author.client.rpc('community_membership', { p_id: group.id, p_action: 'remove', p_target: actor.id }), 'remove republisher');
  check((await posts(follower)).find(p => p.id === privateId).repost === null, 'republisher loss of access revokes delivery');
  await act(actor, privateId, true, 403); await act(actor, privateId, false);
  ok(await actor.client.rpc('community_membership', { p_id: group.id, p_action: 'join' }), 'rejoin for UI test');
  await act(actor, publicId, false);
  for (const person of [actor, follower]) { await api(person, '/api/welcome', { action: 'check' }); await api(person, '/api/welcome', { action: 'acknowledge' }); }
  if (process.env.PLAYWRIGHT_MODULE) {
    const { reviewReposts } = await import('./browser-reposts.mjs');
    await reviewReposts({ origin, actor, follower, publicId, privateId, check });
  }
  await act(actor, publicId);
  sql(`update pico_private.beta_admissions set status='suspended' where player_id='${actor.id}'`);
  check((await posts(follower)).find(p => p.id === publicId).repost === null, 'current suspension hides reference');
  await act(actor, publicId, false, 403);
  sql(`update pico_private.beta_admissions set status='approved' where player_id='${actor.id}'`);
  ok(await author.client.from('blocks').insert({ blocked_id: actor.id }), 'author blocks republisher');
  check((await posts(follower)).find(p => p.id === publicId).repost === null, 'bilateral author block hides reference for third party');
  ok(await author.client.from('blocks').delete().eq('blocked_id', actor.id), 'remove controlled block');
  ok(await author.client.from('posts').delete().eq('id', publicId), 'remove original');
  check(ok(await admin.from('post_reposts').select('post_id').eq('post_id', publicId), 'cascade read').length === 0, 'original deletion removes references');
  completed = true;
} finally {
  if (users.length) ok(await admin.from('posts').delete().in('author_id', users.map(u => u.id)), 'tracked posts cleanup');
  if (groups.length) sql(`delete from public.communities where id in (${groups.map(id => "'" + id + "'").join(',')})`);
  for (const account of users) ok(await admin.auth.admin.deleteUser(account.id), 'tracked identity cleanup');
  writeFileSync('.vercel/reposts-review/hosted.json', JSON.stringify({ completed, checks: checks.length, results: checks, fixturesCleaned: users.length, productionMutated: false }, null, 2));
  console.log('Hosted repost checks:', checks.length, 'completed:', completed, 'fixtures cleaned:', users.length);
}

// Opt-in integration test. Never imported by the app or the offline test suite.
// Creates two disposable users in the explicitly selected development project.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const [projectRef, ...origins] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
assert.match(projectRef ?? '', /^[a-z]{20}$/, 'Pass the development project ref and app origin(s).');
assert.equal(new URL(url).hostname, `${projectRef}.supabase.co`, 'Ref must match the configured backend.');
assert.ok(key?.startsWith('sb_publishable_') && secret?.startsWith('sb_secret_'), 'Public and isolated administrative keys required.');
assert.ok(origins.length > 0, 'At least one running Pico app origin is required.');
for (const origin of origins) {
  const parsed = new URL(origin);
  assert.equal(parsed.origin, origin);
  assert.ok(parsed.protocol === 'https:' || parsed.hostname === 'localhost');
}
const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20000) }) } };
const admin = createClient(url, secret, options);
const anonymous = createClient(url, key, options);
const users = [];
const runId = randomBytes(8).toString('hex');
let checks = 0;
function ok(result, label) {
  assert.ok(!result.error, `${label}: ${result.error?.code ?? 'request failed'}`);
  checks++;
  return result.data;
}
function denied(result, codes, label) {
  assert.ok(result.error && codes.includes(result.error.code), `${label}: expected denial, got ${result.error?.code ?? 'success'}`);
  checks++;
}
function session(jar = new Map()) {
  const client = createServerClient(url, key, {
    global: options.global,
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: entries => entries.forEach(({ name, value }) => value ? jar.set(name, value) : jar.delete(name)),
    },
  });
  return { client, jar };
}
async function account(label) {
  const current = session();
  const email = `pico-e2e-${runId}-${label}@example.com`;
  const password = randomBytes(30).toString('base64url') + 'aA9!';
  const result = await current.client.auth.signUp({ email, password, options: { data: { display_name: `Pico teste ${label}` } } });
  const data = ok(result, `signup ${label}`);
  assert.ok(data.user?.id, 'Signup must create an identifiable disposable user.');
  users.push(data.user.id);
  assert.ok(data.session, 'This development test expects immediate signup; it does not bypass email verification.');
  return { ...current, id: data.user.id, email, password, username: `e2e_${runId}_${label}` };
}
async function request(origin, actor, path, init = {}, status = 200) {
  const response = await fetch(origin + path, {
    ...init, redirect: 'manual', signal: AbortSignal.timeout(25000),
    headers: { Cookie: [...actor.jar].map(([k, v]) => `${k}=${v}`).join('; '), ...init.headers },
  });
  assert.equal(response.status, status, `${origin}${path}: HTTP ${response.status}`);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/, 'Private responses must not be cached.');
  for (const header of response.headers.getSetCookie()) {
    const part = header.split(';')[0], split = part.indexOf('=');
    const name = part.slice(0, split), value = part.slice(split + 1);
    if (value) actor.jar.set(name, value); else actor.jar.delete(name);
  }
  const body = await response.json();
  assert.equal(body.status, status === 200 ? 'success' : 'error', 'Configured app must not fall back to demo.');
  checks++;
  return body.data ?? body;
}
const read = (origin, actor, params, status) => request(origin, actor, '/api/social/read?' + new URLSearchParams(params), {}, status);
const write = (origin, actor, body, status) => request(origin, actor, '/api/social/mutate', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}, status);

try {
  const catalog = ok(await anonymous.from('arena_sports').select('arena_id,sport_id,arenas(slug,is_demo)').limit(20), 'public catalog');
  const place = catalog.find(item => item.arenas?.is_demo);
  assert.ok(place, 'Development seed must contain an explicitly fictional arena.');
  const arenaId = place.arena_id, sportId = place.sport_id;
  const a = await account('a'), b = await account('b');
  const guest = session();
  assert.notEqual(a.id, b.id);

  for (const origin of origins) {
    for (const resource of ['profile', 'feed', 'checkin', 'discover']) await read(origin, guest, { resource }, 401);
    await read(origin, guest, { resource: 'arenas' });
    await write(origin, guest, { action: 'create_post', arenaId, sportId, body: 'Must be rejected' }, 401);
    for (const actor of [a, b]) {
      await write(origin, actor, { action: 'save_profile', name: `Pico teste ${actor === a ? 'A' : 'B'}`, username: actor.username, bio: 'Conta descartável de integração', city: 'São Paulo', neighborhood: 'Teste', sportId, level: 'Intermediário', available: true });
      const profile = (await read(origin, actor, { resource: 'profile' })).profile;
      assert.equal(profile.id, actor.id); assert.equal(profile.onboardingCompleted, true); assert.ok(!('email' in profile));
    }
    await write(origin, a, { action: 'start_checkin', arenaId, sportId });
    const presence = (await read(origin, a, { resource: 'checkin' })).own;
    assert.equal(presence.playerId, a.id);
    const remaining = Date.parse(presence.expiresAt) - Date.now();
    assert.ok(remaining > 7100000 && remaining <= 7205000, 'Presence must expire in two hours.');
    const body = `Integração ${runId} ${origin}`;
    await write(origin, a, { action: 'create_post', arenaId, sportId, body });
    const found = (await read(origin, b, { resource: 'discover', sportId, arenaId, active: 'true' })).players.find(p => p.id === a.id);
    assert.ok(found); assert.equal(found.username, a.username);
    const other = await read(origin, b, { resource: 'player', username: a.username });
    assert.equal(other.own, false); assert.equal(other.profile.id, a.id);
    const post = (await read(origin, b, { resource: 'feed', arenaId })).posts.find(p => p.body === body);
    assert.ok(post); assert.equal(post.author_id, a.id);
    await write(origin, b, { action: 'set_like', postId: post.id, liked: true });
    await write(origin, b, { action: 'set_like', postId: post.id, liked: true });
    await write(origin, b, { action: 'create_comment', postId: post.id, body: `Comentário ${runId}` });
    await write(origin, b, { action: 'set_connection', playerId: a.id, connected: true });
    assert.equal((await read(origin, b, { resource: 'player', username: a.username })).connected, true);
    assert.equal((await read(origin, a, { resource: 'player', username: b.username })).connected, false, 'Connections are unilateral.');
    const updated = (await read(origin, a, { resource: 'feed', arenaId })).posts.find(p => p.id === post.id);
    assert.equal(updated.like_count, 1); assert.equal(updated.comment_count, 1); assert.equal(updated.liked, false);
    const comments = await read(origin, a, { resource: 'comments', postId: post.id });
    assert.equal(comments.comments[0].username, b.username);

    // Attempt direct PostgREST requests, bypassing the app's input validation.
    const changed = ok(await b.client.from('profiles').update({ display_name: 'Unauthorized' }).eq('id', a.id).select('id'), 'RLS-filtered profile update');
    assert.equal(changed.length, 0);
    assert.equal((await read(origin, a, { resource: 'profile' })).profile.name, 'Pico teste A');
    denied(await b.client.from('profiles').update({ id: b.id }).eq('id', a.id), ['42501'], 'profile identity immutable');
    denied(await b.client.from('checkins').insert({ player_id: a.id, arena_id: arenaId, sport_id: sportId, expires_at: new Date(Date.now() + 100000).toISOString() }), ['42501'], 'forged checkin');
    denied(await b.client.from('checkins').update({ ended_at: new Date().toISOString() }).eq('id', presence.id), ['42501'], 'foreign checkin end');
    denied(await b.client.rpc('end_checkin', { player_id: a.id }), ['PGRST202'], 'RPC identity injection');
    ok(await b.client.rpc('end_checkin'), 'B can end only own presence');
    assert.equal((await read(origin, a, { resource: 'checkin' })).own.id, presence.id);
    await write(origin, b, { action: 'end_checkin', player_id: a.id }, 400);
    denied(await b.client.from('posts').insert({ author_id: a.id, arena_id: arenaId, sport_id: sportId, body: 'Forged' }), ['42501'], 'forged post');
    denied(await b.client.from('post_likes').insert({ player_id: a.id, post_id: post.id }), ['42501'], 'forged like');
    denied(await b.client.from('comments').insert({ author_id: a.id, post_id: post.id, body: 'Forged' }), ['42501'], 'forged comment');
    denied(await b.client.from('connections').insert({ follower_id: a.id, followed_id: b.id }), ['42501'], 'forged connection');
    denied(await b.client.from('player_sports').insert({ player_id: a.id, sport_id: sportId }), ['42501'], 'forged player sport');
    denied(await b.client.from('arena_members').insert({ player_id: a.id, arena_id: arenaId }), ['42501'], 'forged arena membership');
    denied(await a.client.rpc('start_checkin', { arena_id: randomUUID(), sport_id: sportId }), ['23514'], 'invalid arena RPC');
    assert.equal((await read(origin, a, { resource: 'checkin' })).own.id, presence.id, 'Rejected checkin must not close current presence.');
    for (const table of ['profiles', 'player_sports', 'arena_members', 'posts', 'post_likes', 'comments', 'checkins', 'connections']) {
      denied(await anonymous.from(table).select('*').limit(1), ['42501'], `anonymous ${table}`);
    }
    denied(await anonymous.rpc('start_checkin', { arena_id: arenaId, sport_id: sportId }), ['42501'], 'anonymous RPC');
    denied(await anonymous.from('posts').insert({ arena_id: arenaId, sport_id: sportId, body: 'Anonymous' }), ['42501'], 'anonymous post');

    // Concurrent hosted requests exercise the per-profile lock on separate DB connections.
    const concurrent = await Promise.all(Array.from({ length: 4 }, () => a.client.rpc('start_checkin', { arena_id: arenaId, sport_id: sportId })));
    concurrent.forEach(result => ok(result, 'concurrent start_checkin'));
    const active = ok(await a.client.from('checkins').select('id').eq('player_id', a.id), 'active checkin count');
    assert.equal(active.length, 1, 'Concurrent checkins must leave exactly one active row.');
    await write(origin, a, { action: 'end_checkin' });
    assert.equal((await read(origin, a, { resource: 'checkin' })).own, null);
    await write(origin, b, { action: 'set_connection', playerId: a.id, connected: false });
    for (const actor of [a, b]) {
      ok(await actor.client.auth.refreshSession(), 'real refresh token exchange');
      assert.equal(ok(await session(actor.jar).client.auth.getUser(), 'session restored from cookies').user.id, actor.id);
      await read(origin, actor, { resource: 'profile' });
      ok(await actor.client.auth.signOut(), 'signout');
      await read(origin, actor, { resource: 'profile' }, 401);
      ok(await actor.client.auth.signInWithPassword({ email: actor.email, password: actor.password }), 'signin');
      await read(origin, actor, { resource: 'profile' });
    }
    console.log(`Hosted social flow, ownership denials, concurrent checkins and session refresh passed: ${origin}`);
  }
  console.log(`${checks} hosted checks passed. Disposable user cleanup follows.`);
} finally {
  let failures = 0;
  for (const id of users) {
    const result = await admin.auth.admin.deleteUser(id);
    if (result.error) { failures++; console.error(`Cleanup failed for disposable user ${id}: ${result.error.code ?? 'unknown'}`); }
  }
  if (failures) throw new Error(`${failures} disposable users require cleanup.`);
  console.log(`Removed ${users.length} disposable users; owned social rows cascade with them.`);
}

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI, PRIVATE } from './helpers/database.mjs';
import { parseMutation, mutateSocial } from '../src/lib/supabase/mutations.ts';
let db;
let postId;
before(async () => {
  db = await createTestDatabase();
  await asUser(db,ALICE,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
  postId = (await asUser(db, ALICE, () => db.query('insert into posts(arena_id,sport_id,body) values($1,$2,$3) returning id', [VILA, FUTEVOLEI, 'Bora pra areia']))).rows[0].id;
  await db.query('insert into posts(author_id,arena_id,sport_id,body) values($1,$2,$3,$4)', [BOB, PRIVATE, FUTEVOLEI, 'Privado']);
});
after(async () => { await db?.close(); });
test('feed uses RLS, accurate counts and current viewer like state', async () => {
  await asUser(db, BOB, async () => {
    await db.query('insert into post_likes(post_id) values($1)', [postId]);
    await db.query('insert into comments(post_id,body) values($1,$2)', [postId, 'Vamos']);
    const rows = (await db.query('select * from read_feed()')).rows;
    assert.equal(rows.length, 1); assert.equal(rows[0].liked, true);
    assert.equal(rows[0].like_count, 1); assert.equal(rows[0].comment_count, 1);
    assert.ok(!('email' in rows[0]));
  });
  await asUser(db, ALICE, async () => { assert.equal((await db.query('select * from read_feed()')).rows[0].liked, false); });
  await asUser(db, null, async () => { await assert.rejects(db.query('select * from read_feed()'), e => e.code === '42501'); });
});
test('feed paginates with lookahead, filters arena and rejects invalid offset', async () => {
  // Seed historical volume administratively; a user may no longer create 25
  // posts in one instant. The separate abuse test covers that boundary.
  for (let i = 0; i < 25; i++) await db.query('insert into posts(author_id,arena_id,sport_id,body) values($1,$2,$3,$4)', [ALICE, VILA, FUTEVOLEI, `Post ${i}`]);
  await asUser(db, ALICE, async () => {
    const first = (await db.query('select * from read_feed(0)')).rows;
    const next = (await db.query('select * from read_feed(20)')).rows;
    assert.equal(first.length, 21); assert.equal(next.length, 6);
    assert.equal(new Set([...first.slice(0,20), ...next].map(p => p.id)).size, 26);
    assert.equal((await db.query('select * from read_feed(0,$1)', [PRIVATE])).rows.length, 0);
    await assert.rejects(db.query('select * from read_feed(-1)'), e => e.code === '23514');
  });
});
test('social mutation parser rejects forged author, oversized and blank content', () => {
  const post = { action: 'create_post', arenaId: VILA, sportId: FUTEVOLEI, body: ' Bora ' };
  assert.equal(parseMutation(post).body, 'Bora');
  for (const extra of [{ author_id: BOB }, { body: ' ' }, { body: 'x'.repeat(501) }]) assert.throws(() => parseMutation({ ...post, ...extra }));
  assert.throws(() => parseMutation({ action: 'create_comment', postId: ALICE, body: 'x'.repeat(281) }));
  assert.throws(() => parseMutation({ action: 'set_like', postId: ALICE, liked: true, player_id: BOB }));
});
test('SDK writes omit author and unlike filters by verified caller; auth failure prevents writes', async () => {
  const calls = [];
  const client = createClient('https://example.supabase.co', 'sb_publishable_fixture_only', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (url, init) => { calls.push({ url: String(url), init }); return new Response(null, { status: 204 }); } } });
  client.auth.getUser = async () => ({ data: { user: { id: ALICE } }, error: null });
  await mutateSocial(client, parseMutation({ action: 'create_post', arenaId: VILA, sportId: FUTEVOLEI, body: 'Bora' }));
  assert.deepEqual(JSON.parse(calls[0].init.body), { arena_id: VILA, sport_id: FUTEVOLEI, body: 'Bora' });
  await mutateSocial(client, parseMutation({ action: 'set_like', postId: BOB, liked: false }));
  assert.equal(new URL(calls[1].url).searchParams.get('player_id'), `eq.${ALICE}`);
  client.auth.getUser = async () => ({ data: { user: null }, error: null });
  await assert.rejects(mutateSocial(client, { action: 'set_like', postId: BOB, liked: true }), e => e.status === 401);
  assert.equal(calls.length, 2);
});

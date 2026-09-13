import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, VILA } from './helpers/database.mjs';

const CLARA = '30000000-0000-4000-8000-000000000003';
const DORA = '30000000-0000-4000-8000-000000000004';
async function setup() {
  const db = await createTestDatabase();
  await db.query("insert into auth.users(id,email) values($1,'clara@example.invalid'),($2,'dora@example.invalid')", [CLARA, DORA]);
  await db.exec(`insert into pico_private.beta_admissions(player_id,status) values('${CLARA}','approved'),('${DORA}','approved') on conflict do nothing`);
  return db;
}
const feed = async (db, who, args = []) => asUser(db, who, async () => (await db.query(`select public.read_repost_feed(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`, args)).rows[0].r);
const repost = (db, who, post, state = true) => asUser(db, who, () => db.query('select public.set_post_repost($1,$2)', [post, state]));
const publish = (db, body = 'Relato original') => asUser(db, ALICE, async () => (await db.query('select public.publish_post($1,$2) id', [randomUUID(), body])).rows[0].id);
const follow = (db, follower, followed) => asUser(db, follower, () => db.query('insert into public.connections(followed_id) values($1)', [followed]));

test('reposts retain canonical data, are idempotent, reach followers and profiles, and never add wall destinations', async () => {
  const db = await setup();
  try {
    const id = await publish(db);
    await db.query('insert into public.post_destinations(post_id,arena_id) values($1,$2)', [id, VILA]);
    await follow(db, CLARA, BOB);
    await follow(db, BOB, DORA); // Reverse direction must not deliver Bob's repost to Dora.
    await repost(db, BOB, id);
    const before = (await db.query('select * from public.post_reposts where post_id=$1', [id])).rows;
    await repost(db, BOB, id);
    assert.deepEqual((await db.query('select * from public.post_reposts where post_id=$1', [id])).rows, before);
    const original = (await feed(db, CLARA)).find(p => p.id === id);
    assert.equal(original.repost.player_id, BOB);
    assert.equal(original.author_id, ALICE);
    assert.equal(original.body, 'Relato original');
    assert.equal((await feed(db, DORA)).find(p => p.id === id).repost, null);
    assert.equal((await feed(db, BOB)).find(p => p.id === id).reposted, true);
    assert.equal((await feed(db, DORA, [0, null, null, BOB])).filter(p => p.id === id).length, 1);
    assert.equal((await feed(db, CLARA, [0, VILA])).find(p => p.id === id).repost, null);
    assert.equal((await feed(db, CLARA, [0, null, null, null, id]))[0].repost, null);
    assert.equal((await db.query('select count(*)::int n from public.post_destinations where post_id=$1', [id])).rows[0].n, 1);
    await asUser(db, CLARA, () => db.query("insert into public.comments(post_id,body) values($1,'Comentário no original');", [id]));
    assert.equal((await feed(db, BOB)).find(p => p.id === id).comment_count, 1);
    await asUser(db, ALICE, () => db.query("update public.posts set body='Original editado' where id=$1", [id]));
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).body, 'Original editado');
    await repost(db, BOB, id, false); await repost(db, BOB, id, false);
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost, null);
    assert.equal((await feed(db, BOB, [0, null, null, BOB])).length, 0);
    assert.equal((await db.query('select count(*)::int n from public.comments where post_id=$1', [id])).rows[0].n, 1);
    await repost(db, BOB, id);
    await asUser(db, ALICE, () => db.query('delete from public.posts where id=$1', [id]));
    assert.equal((await db.query('select * from public.post_reposts where post_id=$1', [id])).rows.length, 0);
  } finally { await db.close(); }
});

test('private reposts require both participants; membership loss, suspension and bilateral blocks revoke visibility', async () => {
  const db = await setup();
  try {
    let group, id;
    await asUser(db, ALICE, async () => {
      group = (await db.query('select public.create_community($1) r', [{ name: 'Grupo privado', description: '', rules: '', entry_mode: 'open', visibility: 'private', sports: [] }])).rows[0].r.id;
      id = (await db.query("select public.publish_post($1,'Privado',null,null,null,'private',null,$2) id", [randomUUID(), [group]])).rows[0].id;
    });
    for (const who of [BOB, CLARA]) await asUser(db, who, () => db.query("select public.community_membership($1,'join')", [group]));
    await follow(db, CLARA, BOB); await follow(db, DORA, BOB);
    await repost(db, BOB, id);
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost.player_id, BOB);
    assert.equal((await feed(db, DORA, [0, null, null, BOB])).length, 0);
    assert.equal((await feed(db, DORA, [0, null, null, null, id])).length, 0);
    await assert.rejects(repost(db, DORA, id), e => e.code === '42501');
    await asUser(db, DORA, async () => assert.equal((await db.query('select * from public.post_reposts where post_id=$1', [id])).rows.length, 0));
    await asUser(db, ALICE, () => db.query("select public.community_membership($1,'remove',$2)", [group, BOB]));
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost, null);
    await assert.rejects(repost(db, BOB, id), e => e.code === '42501');
    await repost(db, BOB, id, false); // Cleanup remains possible after losing access.
    await asUser(db, BOB, () => db.query("select public.community_membership($1,'join')", [group]));
    await repost(db, BOB, id);
    await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1", [BOB]);
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost, null);
    await assert.rejects(repost(db, BOB, id, false), e => e.code === '42501');
    await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1", [BOB]);
    await asUser(db, ALICE, () => db.query('insert into public.blocks(blocked_id) values($1)', [BOB]));
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost, null);
    await asUser(db, ALICE, () => db.query('delete from public.blocks where blocked_id=$1', [BOB]));
    await asUser(db, CLARA, () => db.query('insert into public.blocks(blocked_id) values($1)', [BOB]));
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost, null);
    await asUser(db, ALICE, () => db.query("select public.community_membership($1,'remove',$2)", [group, CLARA]));
    assert.equal((await feed(db, CLARA)).some(p => p.id === id), false);
  } finally { await db.close(); }
});

test('repost authorization denies forged writes, anonymous/own/hidden posts; deletion markers and moderation apply', async () => {
  const db = await setup();
  try {
    const id = await publish(db);
    await assert.rejects(repost(db, null, id), e => e.code === '42501');
    await assert.rejects(repost(db, ALICE, id), e => e.code === '42501');
    await assert.rejects(repost(db, BOB, randomUUID()), e => e.code === '42501');
    await assert.rejects(repost(db, BOB, id, null), e => e.code === '23514');
    await asUser(db, BOB, async () => {
      await assert.rejects(db.query('insert into public.post_reposts(post_id,player_id) values($1,$2)', [id, CLARA]), e => e.code === '42501');
      await assert.rejects(db.query('delete from public.post_reposts'), e => e.code === '42501');
      await assert.rejects(db.query("update public.post_reposts set created_at=now()"), e => e.code === '42501');
    });
    await repost(db, BOB, id); await follow(db, CLARA, BOB);
    await db.query('insert into public.account_deletions(player_id) values($1)', [BOB]);
    assert.equal((await feed(db, CLARA)).find(p => p.id === id).repost, null);
    await db.query('delete from public.account_deletions where player_id=$1', [BOB]);
    await db.query('update public.posts set moderated_at=now() where id=$1', [id]);
    assert.equal((await feed(db, CLARA)).some(p => p.id === id), false);
    await assert.rejects(repost(db, BOB, id), e => e.code === '42501');
    await db.query('update public.posts set moderated_at=null,arena_id=$2 where id=$1', [id, VILA]);
    await db.query("update public.arenas set status='archived' where id=$1", [VILA]);
    await assert.rejects(repost(db, BOB, id), e => e.code === '42501');
  } finally { await db.close(); }
});

test('feed deduplicates multiple republishers before pagination, orders by effective date and keeps old RPC intact', async () => {
  const db = await setup();
  try {
    await db.query("insert into public.posts(author_id,body,created_at,distribution_explicit) select $1,'Post '||n,now()-n*interval '1 hour',true from generate_series(1,25) n", [ALICE]);
    const id = (await db.query("select id from public.posts where body='Post 25'")).rows[0].id;
    await follow(db, CLARA, BOB); await follow(db, CLARA, DORA);
    await repost(db, BOB, id); await repost(db, DORA, id);
    await db.query("update public.post_reposts set created_at=now()+interval '1 second' where player_id=$1", [DORA]);
    const first = await feed(db, CLARA), next = await feed(db, CLARA, [20]);
    assert.equal(first.length, 21); assert.equal(first[0].id, id); assert.equal(first[0].repost.player_id, DORA);
    const ids = [...first.slice(0,20), ...next.slice(0,20)].map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
    await repost(db, DORA, id, false);
    assert.equal((await feed(db, CLARA))[0].repost.player_id, BOB);
    await asUser(db, CLARA, async () => {
      const old = (await db.query('select public.read_social_feed() r')).rows[0].r;
      assert.equal(old.some(p => p.id === id), false);
      await assert.rejects(db.query('select public.read_repost_feed(-1)'), e => e.code === '23514');
    });
    await db.query("insert into pico_private.write_limits(player_id,action,window_start,used) values($1,'reposts',to_timestamp(floor(extract(epoch from clock_timestamp())/3600)*3600),60) on conflict(player_id,action) do update set used=60", [BOB]);
    await assert.rejects(repost(db, BOB, id, false), e => e.code === 'P0429');
    await repost(db, BOB, id); // Already-desired state does not consume rate budget.
  } finally { await db.close(); }
});

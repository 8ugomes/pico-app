import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';

const reserve = (db, who) => asUser(db, who, async () => (await db.query('select public.reserve_post_video() path')).rows[0].path);
const publish = (db, who, key, path, audience = 'beta', groups = []) => asUser(db, who, async () =>
  (await db.query('select public.publish_post_media($1,$2,null,null,null,$3,null,$4,$5) id',
    [key, 'Um vídeo depois do jogo', audience, groups, path])).rows[0].id);
const feed = (db, who) => asUser(db, who, async () => (await db.query('select public.read_repost_feed() posts')).rows[0].posts);
const canRead = (db, who, path) => asUser(db, who, async () => (await db.query('select public.can_read_post_video($1) allowed', [path])).rows[0].allowed);
const publishMentionedVideo = (db, key, body, group, path) => asUser(db, ALICE, async () =>
  (await db.query(
    "select public.publish_post_with_mentions_media($1,$2,null,null,null,'private',null,$3::uuid[],$4,$5::uuid[],false,$6) id",
    [key, body, [group], group, [BOB], path])).rows[0].id);

test('private post videos require a ready owned asset, are single-use and follow current audience', async () => {
  const db = await createTestDatabase();
  try {
    const path = await reserve(db, ALICE);
    assert.match(path, new RegExp(`^${ALICE}/[0-9a-f-]{36}\\.mp4$`));
    await assert.rejects(publish(db, ALICE, randomUUID(), path), e => e.code === '23514');
    await db.query('update public.post_video_assets set ready=true,byte_size=1024 where path=$1', [path]);
    await assert.rejects(publish(db, BOB, randomUUID(), path), e => e.code === '23514');
    const key = randomUUID();
    const id = await publish(db, ALICE, key, path);
    assert.equal(await publish(db, ALICE, key, path), id);
    assert.equal((await feed(db, BOB)).find(p => p.id === id).video_path, path);
    assert.equal(await canRead(db, BOB, path), true);
    await assert.rejects(publish(db, ALICE, randomUUID(), path), e => e.code === '23505');
    await assert.rejects(publish(db, ALICE, key, null), e => e.code === 'P0409');
    await db.query('update public.posts set moderated_at=now() where id=$1', [id]);
    assert.equal(await canRead(db, BOB, path), false);
  } finally { await db.close(); }
});

test('published videos do not consume the eight unused upload slots', async () => {
  const db = await createTestDatabase();
  try {
    for (let index = 0; index < 4; index++) {
      const path = await reserve(db, ALICE);
      await db.query('update public.post_video_assets set ready=true,byte_size=1024 where path=$1', [path]);
      await publish(db, ALICE, randomUUID(), path);
    }
    const drafts = await Promise.all(Array.from({ length: 8 }, () => reserve(db, ALICE)));
    assert.equal(drafts.length, 8);
    const removable = await asUser(db, ALICE, async () => (await db.query('select public.read_unused_post_videos() data')).rows[0].data);
    assert.deepEqual(removable.map(item => item.path).sort(), drafts.slice().sort());
    await assert.rejects(reserve(db, ALICE), error => error.code === 'P0429');
  } finally { await db.close(); }
});

test('video in a private community is unavailable to outsiders and revoked after leaving', async () => {
  const db = await createTestDatabase();
  try {
    const group = await asUser(db, ALICE, async () => (await db.query('select public.create_community($1) r',
      [{ name: 'Vídeos da turma', description: '', rules: '', entry_mode: 'open', visibility: 'private', sports: [] }])).rows[0].r.id);
    const path = await reserve(db, ALICE);
    await db.query('update public.post_video_assets set ready=true,byte_size=1024 where path=$1', [path]);
    const id = await publish(db, ALICE, randomUUID(), path, 'private', [group]);
    assert.equal(await canRead(db, BOB, path), false);
    assert.equal((await feed(db, BOB)).some(p => p.id === id), false);
    await asUser(db, BOB, () => db.query("select public.community_membership($1,'join')", [group]));
    assert.equal(await canRead(db, BOB, path), true);
    await asUser(db, BOB, () => db.query("select public.community_membership($1,'leave')", [group]));
    assert.equal(await canRead(db, BOB, path), false);
    assert.equal((await feed(db, BOB)).some(p => p.id === id), false);
  } finally { await db.close(); }
});

test('video posts preserve inline mentions, atomic notification delivery and idempotent retries', async () => {
  const db = await createTestDatabase();
  try {
    const group = await asUser(db, ALICE, async () => (await db.query('select public.create_community($1) r',
      [{ name: 'Vídeo com menções', sports: [], visibility: 'private', entry_mode: 'open' }])).rows[0].r.id);
    await asUser(db, BOB, () => db.query("select public.community_membership($1,'join')", [group]));
    await asUser(db, BOB, () => db.query("update public.profiles set username='bob_teste' where id=$1", [BOB]));
    const path = await reserve(db, ALICE);
    const otherPath = await reserve(db, ALICE);
    await db.query('update public.post_video_assets set ready=true,byte_size=1024 where path=any($1)', [[path, otherPath]]);
    const key = randomUUID();
    const body = 'Vamos com @bob_teste jogar amanhã?';
    const id = await publishMentionedVideo(db, key, body, group, path);
    assert.equal(await publishMentionedVideo(db, key, body, group, path), id);
    assert.equal((await db.query('select body,video_path from public.posts where id=$1', [id])).rows[0].body, body);
    assert.equal((await feed(db, BOB)).find(post => post.id === id).video_path, path);
    const notices = await asUser(db, BOB, async () => (await db.query('select public.read_notifications() r')).rows[0].r.items);
    assert.equal(notices.filter(notice => notice.post_id === id && notice.kind === 'post_mention').length, 1);
    assert.equal((await db.query('select count(*)::int n from pico_private.mention_publications where post_id=$1', [id])).rows[0].n, 1);
    await assert.rejects(publishMentionedVideo(db, key, body, group, otherPath), error => error.code === 'P0409');
    await asUser(db, ALICE, () => assert.rejects(db.query('select public.claim_unused_post_video($1)', [path]), error => error.code === 'P0409'));

    const unreadyPath = await reserve(db, ALICE);
    const failedKey = randomUUID();
    await assert.rejects(publishMentionedVideo(db, failedKey, 'Vídeo falhou @bob_teste', group, unreadyPath),
      error => error.code === '23514');
    assert.equal((await db.query('select count(*)::int n from public.posts where idempotency_key=$1', [failedKey])).rows[0].n, 0);
    assert.equal((await db.query("select count(*)::int n from public.notifications where kind='post_mention' and recipient_id=$1", [BOB])).rows[0].n, 1);
  } finally { await db.close(); }
});

test('sharing a private game with video is explicit and retries do not duplicate its post', async () => {
  const db = await createTestDatabase();
  try {
    const game = randomUUID(), key = randomUUID(), path = await reserve(db, ALICE);
    await db.query('update public.post_video_assets set ready=true,byte_size=1024 where path=$1', [path]);
    await asUser(db, ALICE, () => db.query('select public.save_played_game($1,$2,$3,$4)', [game, VILA, FUTEVOLEI, '2026-09-01']));
    assert.equal((await feed(db, BOB)).length, 0);
    const share = (video) => asUser(db, ALICE, async () => (await db.query(
      "select public.share_played_game_media($1,1,$2,'',null,'beta',null,'{}'::uuid[],$3) id", [game, key, video])).rows[0].id);
    const id = await share(path);
    assert.equal(await share(path), id);
    assert.equal((await feed(db, BOB)).find(p => p.id === id).video_path, path);
    await assert.rejects(share(null), e => e.code === 'P0409');
    assert.equal((await db.query('select count(*)::int n from public.posts where idempotency_key=$1', [key])).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int n from public.post_game_context where post_id=$1', [id])).rows[0].n, 1);
  } finally { await db.close(); }
});

test('reported video is inspected only by an operator, and owner export includes media and declared arenas', async () => {
  const db = await createTestDatabase();
  try {
    const path = await reserve(db, ALICE), key = randomUUID();
    await db.query('update public.post_video_assets set ready=true,byte_size=1024 where path=$1', [path]);
    const id = await publish(db, ALICE, key, path);
    const arena = (await db.query("select id from public.arenas where slug='r7-academia'")).rows[0].id;
    await asUser(db, ALICE, () => db.query('select public.set_played_arena_mark($1,true)', [arena]));
    const report = await asUser(db, BOB, async () => (await db.query("insert into public.reports(post_id,reason) values($1,'spam') returning id", [id])).rows[0].id);
    await asUser(db, ALICE, () => assert.rejects(db.query('select public.report_video($1)', [report]), e => e.code === '42501'));
    await db.query("insert into pico_private.platform_grants(player_id,role) values($1,'moderator')", [BOB]);
    await asUser(db, BOB, async () => assert.equal((await db.query('select public.report_video($1) path', [report])).rows[0].path, path));
    assert.equal((await db.query("select count(*)::int n from pico_private.audit_events where action='report.inspect_video' and scope_id=$1", [report])).rows[0].n, 1);
    await asUser(db, ALICE, () => assert.rejects(db.query('select public.export_account_media_extra($1)', [ALICE]), e => e.code === '42501'));
    const exported = (await db.query('select public.export_account_media_extra($1) payload', [ALICE])).rows[0].payload;
    assert.deepEqual(exported.videos.map(v => [v.path, v.post_id]), [[path, id]]);
    assert.deepEqual(exported.played_arena_marks.map(m => m.arena_id), [arena]);
  } finally { await db.close(); }
});

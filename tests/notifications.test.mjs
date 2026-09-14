import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, asUser, ALICE, BOB } from './helpers/database.mjs';
const CAROL = '30000000-0000-4000-8000-000000000003';
const draft = { name: 'Comunidade de teste', sports: [], visibility: 'private', entry_mode: 'open' };
const read = async db => (await db.query('select public.read_notifications() r')).rows[0].r;
const group = async (db, entry_mode = 'open') => asUser(db, ALICE, async () => (await db.query('select public.create_community($1) r', [{ ...draft, entry_mode }])).rows[0].r);
const member = (db, who, id, action = 'join', target = null) => asUser(db, who, () => db.query('select public.community_membership($1,$2,$3)', [id, action, target]));
async function carol(db) {
  await db.query("insert into auth.users(id,email) values($1,'carol@example.invalid')", [CAROL]);
}

test('join notifies existing active members once, persists reads, prevents forged access and marks only own inbox', async () => {
  const db = await createTestDatabase();
  try {
    await carol(db);
    const g = await group(db);
    assert.equal((await asUser(db, ALICE, () => read(db))).items.length, 0);
    const avatarPath = (await asUser(db, BOB, () => db.query("select public.reserve_media('avatars') as path"))).rows[0].path;
    await db.query('update public.media_assets set ready=true where path=$1', [avatarPath]);
    await db.query("insert into storage.objects(bucket_id,name) values('avatars',$1)", [avatarPath]);
    await asUser(db, BOB, () => db.query('update public.profiles set avatar_path=$1 where id=$2', [avatarPath, BOB]));
    await member(db, BOB, g.id);
    await member(db, BOB, g.id);
    let inbox = await asUser(db, ALICE, () => read(db));
    assert.equal(inbox.unreadCount, 1);
    assert.equal(inbox.items[0].community_slug, g.slug);
    assert.equal(inbox.items[0].actor_avatar_path, avatarPath);
    await asUser(db, BOB, () => db.query('update public.profiles set avatar_path=null where id=$1', [BOB]));
    assert.equal((await asUser(db, ALICE, () => read(db))).items[0].actor_avatar_path, null);
    assert.equal((await asUser(db, BOB, () => read(db))).items.length, 0);
    assert.equal((await asUser(db, CAROL, () => read(db))).items.length, 0);
    await asUser(db, CAROL, async () => {
      assert.equal((await db.query('select * from public.notifications')).rows.length, 0);
      await db.query('select public.mark_notifications_read($1)', [[inbox.items[0].id]]);
      await assert.rejects(db.query('insert into public.notifications(recipient_id,actor_id,community_id) values($1,$2,$3)', [ALICE, BOB, g.id]));
      await assert.rejects(db.query('update public.notifications set read_at=now()'));
    });
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 1);
    await asUser(db, ALICE, () => db.query('select public.mark_notifications_read($1)', [[inbox.items[0].id]]));
    inbox = await asUser(db, ALICE, () => read(db));
    assert.equal(inbox.unreadCount, 0);
    const timestamp = inbox.items[0].read_at;
    await asUser(db, ALICE, () => db.query('select public.mark_notifications_read($1)', [[inbox.items[0].id]]));
    assert.equal((await asUser(db, ALICE, () => read(db))).items[0].read_at, timestamp);
    await member(db, CAROL, g.id);
    await asUser(db, BOB, () => db.query('select public.mark_all_notifications_read()'));
    assert.equal((await asUser(db, BOB, () => read(db))).unreadCount, 0);
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 1);
    await asUser(db, null, () => assert.rejects(read(db)));
    await asUser(db, ALICE, () => assert.rejects(db.query('select public.mark_notifications_read($1)', [[]])));
  } finally { await db.close(); }
});

test('approval and invitation notify only on activation, never on pending, roles, or repeated approvals', async () => {
  const db = await createTestDatabase();
  try {
    const g = await group(db, 'approval');
    await member(db, BOB, g.id);
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 0);
    await member(db, ALICE, g.id, 'approve', BOB);
    await member(db, ALICE, g.id, 'approve', BOB);
    await asUser(db, ALICE, () => db.query("select public.community_membership($1,'role',$2,'moderator')", [g.id, BOB]));
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 1);
    const inviteGroup = await group(db, 'invite');
    const invite = await asUser(db, ALICE, async () => (await db.query("select public.invite_community_member($1,'bob@example.invalid') r", [inviteGroup.id])).rows[0].r);
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 1);
    await asUser(db, BOB, () => db.query('select public.accept_community_invite($1)', [invite.token]));
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 2);
  } finally { await db.close(); }
});

test('current blocks, membership, admission and deletion gate notifications; departing recipient loses old inbox', async () => {
  const db = await createTestDatabase();
  try {
    await carol(db);
    const g = await group(db);
    await member(db, BOB, g.id);
    await asUser(db, ALICE, () => db.query('insert into public.blocks(blocked_id) values($1)', [BOB]));
    assert.equal((await asUser(db, ALICE, () => read(db))).items.length, 0);
    await asUser(db, ALICE, () => db.query('delete from public.blocks where blocked_id=$1', [BOB]));
    await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1", [BOB]);
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 0);
    await asUser(db, BOB, () => assert.rejects(read(db)));
    await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1", [BOB]);
    await member(db, CAROL, g.id);
    assert.equal((await asUser(db, BOB, () => read(db))).unreadCount, 1);
    await member(db, BOB, g.id, 'leave');
    assert.equal((await asUser(db, BOB, () => read(db))).unreadCount, 0);
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 1);
    await member(db, BOB, g.id);
    assert.equal((await asUser(db, BOB, () => read(db))).items.length, 0);
    await db.query('delete from auth.users where id=$1', [CAROL]);
    assert.equal((await db.query('select * from public.notifications where actor_id=$1 or recipient_id=$1', [CAROL])).rows.length, 0);
    await db.query('delete from public.communities where id=$1', [g.id]);
    assert.equal((await asUser(db, ALICE, () => read(db))).items.length, 0);
  } finally { await db.close(); }
});

test('keyset pagination has no duplicate rows with equal timestamps and rejects foreign cursors', async () => {
  const db = await createTestDatabase();
  try {
    await carol(db);
    const g = await group(db);
    await member(db, BOB, g.id);
    // Controlled history, only in disposable SQL database.
    await db.query('insert into public.notifications(recipient_id,actor_id,community_id,created_at) select $1,$2,$3,now() from generate_series(1,25)', [ALICE, BOB, g.id]);
    const first = await asUser(db, ALICE, () => read(db));
    assert.equal(first.items.length, 20);
    assert.equal(first.unreadCount, 26);
    const second = await asUser(db, ALICE, async () => (await db.query('select public.read_notifications($1) r', [first.nextCursor])).rows[0].r);
    assert.equal(second.items.length, 6);
    assert.equal(new Set([...first.items, ...second.items].map(n => n.id)).size, 26);
    const foreign = await asUser(db, CAROL, async () => (await db.query('select public.read_notifications($1) r', [first.nextCursor])).rows[0].r);
    assert.deepEqual(foreign.items, []);
    await asUser(db, ALICE, () => db.query('select public.mark_all_notifications_read()'));
    assert.equal((await asUser(db, ALICE, () => read(db))).unreadCount, 0);
  } finally { await db.close(); }
});

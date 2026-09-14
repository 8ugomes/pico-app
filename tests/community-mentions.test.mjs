import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB } from './helpers/database.mjs';

const CAROL = '30000000-0000-4000-8000-000000000003';
const create = (db, name, visibility = 'beta') => asUser(db, ALICE, async () =>
  (await db.query('select public.create_community($1) r', [{ name, sports: [], visibility, entry_mode: 'open' }])).rows[0].r);
const join = (db, person, group) => asUser(db, person, () => db.query("select public.community_membership($1,'join')", [group]));
const publish = (db, key, body, group, people = [], everyone = false, audience = 'beta') =>
  asUser(db, ALICE, async () => (await db.query(
    'select public.publish_post_with_mentions($1,$2,null,null,null,$3,null,$4,$5,$6,$7) id',
    [key, body, audience, [group], group, people, everyone])).rows[0].id);
const inbox = (db, person) => asUser(db, person, async () => (await db.query('select public.read_notifications() r')).rows[0].r);

test('individual and @todos mentions notify only eligible current members and are idempotent', async () => {
  const db = await createTestDatabase();
  try {
    await db.query("insert into auth.users(id,email) values($1,'carol@example.invalid')", [CAROL]);
    const group = await create(db, 'Turma de menções');
    await join(db, BOB, group.id);
    await join(db, CAROL, group.id);
    await asUser(db, BOB, () => db.query("update public.profiles set username='bob_teste',display_name='Bob Teste' where id=$1", [BOB]));
    await asUser(db, BOB, () => db.query('select public.mark_all_notifications_read()'));
    await asUser(db, ALICE, () => db.query('select public.mark_all_notifications_read()'));
    const candidates = await asUser(db, ALICE, async () => (await db.query('select public.community_mention_candidates($1,$2) r', [group.id, 'bob'])).rows[0].r);
    assert.deepEqual(candidates.map(p => p.id), [BOB]);
    await asUser(db, CAROL, () => assert.rejects(db.query('select public.community_mention_candidates($1)', [randomUUID()])));

    const key = randomUUID();
    const post = await publish(db, key, 'Vamos jogar?', group.id, [BOB]);
    await asUser(db, BOB, () => db.query("update public.profiles set username='bob_novo' where id=$1", [BOB]));
    assert.equal(await publish(db, key, 'Vamos jogar?', group.id, [BOB]), post);
    assert.equal((await inbox(db, BOB)).items.filter(n => n.post_id === post).length, 1);
    assert.equal((await inbox(db, CAROL)).items.filter(n => n.post_id === post).length, 0);
    assert.equal((await inbox(db, ALICE)).items.filter(n => n.post_id === post).length, 0);
    const notice = (await inbox(db, BOB)).items.find(n => n.post_id === post);
    await asUser(db, CAROL, () => db.query('select public.mark_notifications_read($1)', [[notice.id]]));
    assert.equal((await inbox(db, BOB)).items.find(n => n.id === notice.id).read_at, null);
    await asUser(db, BOB, () => db.query('select public.mark_notifications_read($1)', [[notice.id]]));
    assert.ok((await inbox(db, BOB)).items.find(n => n.id === notice.id).read_at);
    assert.match((await db.query('select body from public.posts where id=$1', [post])).rows[0].body, /@bob/);
    await assert.rejects(publish(db, key, 'Vamos jogar?', group.id, [CAROL]), error => error.code === 'P0409');

    const all = await publish(db, randomUUID(), 'Encontro de sábado', group.id, [], true);
    assert.equal((await inbox(db, BOB)).items.filter(n => n.post_id === all).length, 1);
    assert.equal((await inbox(db, CAROL)).items.filter(n => n.post_id === all).length, 1);
    assert.equal((await inbox(db, ALICE)).items.filter(n => n.post_id === all).length, 0);
    assert.match((await db.query('select body from public.posts where id=$1', [all])).rows[0].body, /@todos$/);
    await asUser(db, CAROL, () => db.query('insert into public.blocks(blocked_id) values($1)', [ALICE]));
    const limited = await publish(db, randomUUID(), 'Só quem pode receber', group.id, [], true);
    assert.equal((await inbox(db, BOB)).items.some(n => n.post_id === limited), true);
    assert.equal((await inbox(db, CAROL)).items.some(n => n.post_id === limited), false);
    await publish(db, randomUUID(), 'Terceiro aviso', group.id, [], true);
    await assert.rejects(publish(db, randomUUID(), 'Quarto aviso', group.id, [], true), error => error.code === 'P0429');
    assert.equal((await db.query("select count(*)::int n from public.posts where body like 'Quarto aviso%'")).rows[0].n, 0);
    await assert.rejects(publish(db, randomUUID(), 'Invalida', group.id, [BOB], true));
    await assert.rejects(publish(db, randomUUID(), 'Fora do grupo', group.id, [randomUUID()]));
    await asUser(db, ALICE, () => assert.rejects(db.query(
      'select public.publish_post_with_mentions($1,$2,null,null,null,$3,null,$4,$5,$6,$7)',
      [randomUUID(), 'Sem destino', 'beta', [], group.id, [BOB], false])));
    assert.equal((await db.query("select count(*)::int n from public.posts where body like 'Invalida%' or body like 'Fora do grupo%'")).rows[0].n, 0);
  } finally { await db.close(); }
});

test('current membership, blocks, destination and post access govern mention delivery', async () => {
  const db = await createTestDatabase();
  try {
    await db.query("insert into auth.users(id,email) values($1,'carol@example.invalid')", [CAROL]);
    const group = await create(db, 'Grupo reservado', 'private');
    await join(db, BOB, group.id);
    await join(db, CAROL, group.id);
    const post = await publish(db, randomUUID(), 'No grupo', group.id, [BOB], false, 'private');
    assert.equal((await inbox(db, BOB)).items.some(n => n.post_id === post), true);
    assert.equal((await inbox(db, CAROL)).items.some(n => n.post_id === post), false);
    await asUser(db, BOB, () => db.query('insert into public.blocks(blocked_id) values($1)', [ALICE]));
    assert.equal((await inbox(db, BOB)).items.some(n => n.post_id === post), false);
    await assert.rejects(publish(db, randomUUID(), 'Bloqueio', group.id, [BOB], false, 'private'));
    await asUser(db, BOB, () => db.query('delete from public.blocks where blocked_id=$1', [ALICE]));
    assert.equal((await inbox(db, BOB)).items.some(n => n.post_id === post), true);
    await asUser(db, ALICE, () => db.query('select public.remove_distribution($1,null,$2)', [post, group.id]));
    assert.equal((await inbox(db, BOB)).items.some(n => n.post_id === post), false);
    const next = await publish(db, randomUUID(), 'Outra chamada', group.id, [BOB], false, 'private');
    await asUser(db, BOB, () => db.query("select public.community_membership($1,'leave')", [group.id]));
    assert.equal((await inbox(db, BOB)).items.some(n => n.post_id === next), false);
    assert.equal((await db.query('select count(*)::int n from public.notifications where recipient_id=$1 and post_id=$2', [BOB, next])).rows[0].n, 0);
  } finally { await db.close(); }
});

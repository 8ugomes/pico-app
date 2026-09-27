import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import { ALICE, BOB, asUser, createTestDatabase } from './helpers/database.mjs';

const CAROL = '30000000-0000-4000-8000-000000000003';
const readNotifications = async (db) => (await db.query('select public.read_notifications() r')).rows[0].r;
const denied = (promise) => assert.rejects(promise, (error) => error.code === '42501');

async function addCarol(db) {
  await db.query("insert into auth.users(id,email) values($1,'carol@example.invalid')", [CAROL]);
}

async function mutual(db) {
  await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1) on conflict do nothing', [BOB]));
  await asUser(db, BOB, () => db.query('insert into public.connections(followed_id) values($1) on conflict do nothing', [ALICE]));
}

test('a follow creates one current, actionable intent without toggle spam', async () => {
  const db = await createTestDatabase();
  try {
    const aliceUsername = (await db.query('select username from public.profiles where id=$1', [ALICE])).rows[0].username;
    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    assert.equal((await asUser(db, BOB, () => readNotifications(db))).items.length, 0, 'the rollout gate starts closed and does not backfill');
    await asUser(db, ALICE, () => db.query('delete from public.connections where followed_id=$1', [BOB]));
    await db.exec('update pico_private.social_intent_settings set enabled=true');
    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    let inbox = await asUser(db, BOB, () => readNotifications(db));
    assert.equal(inbox.unreadCount, 1);
    assert.equal(inbox.items[0].kind, 'new_follower');
    assert.equal(inbox.items[0].actor_id, ALICE);
    assert.equal(inbox.items[0].actor_username, aliceUsername);
    assert.equal(inbox.items[0].recipient_follows_actor, false);
    assert.deepEqual(
      await asUser(db, ALICE, async () => (await db.query('select public.read_connection_state($1) state', [BOB])).rows[0].state),
      { followsYou: false, following: true, mutual: false },
    );
    assert.deepEqual(
      await asUser(db, BOB, async () => (await db.query('select public.read_connection_state($1) state', [ALICE])).rows[0].state),
      { followsYou: true, following: false, mutual: false },
    );
    const first = inbox.items[0];

    await asUser(db, ALICE, () => db.query('delete from public.connections where followed_id=$1', [BOB]));
    assert.equal((await asUser(db, BOB, () => readNotifications(db))).items.length, 0);
    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    inbox = await asUser(db, BOB, () => readNotifications(db));
    assert.equal(inbox.items.length, 1);
    assert.equal(inbox.items[0].id, first.id);
    assert.equal(inbox.items[0].created_at, first.created_at);

    await asUser(db, BOB, () => db.query('select public.mark_notifications_read($1)', [[first.id]]));
    await asUser(db, BOB, () => db.query('insert into public.connections(followed_id) values($1)', [ALICE]));
    inbox = await asUser(db, BOB, () => readNotifications(db));
    assert.equal(inbox.unreadCount, 0);
    assert.equal(inbox.items[0].recipient_follows_actor, true);
    assert.deepEqual(
      await asUser(db, BOB, async () => (await db.query('select public.read_connection_state($1) state', [ALICE])).rows[0].state),
      { followsYou: true, following: true, mutual: true },
    );

    await db.query("update public.notifications set created_at=now()-interval '31 days' where id=$1", [first.id]);
    await asUser(db, ALICE, () => db.query('delete from public.connections where followed_id=$1', [BOB]));
    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    inbox = await asUser(db, BOB, () => readNotifications(db));
    assert.equal(inbox.unreadCount, 1);
    assert.equal(inbox.items[0].id, first.id);
    const renewedAt = inbox.items[0].created_at;
    await asUser(db, ALICE, () => db.query('delete from public.connections where followed_id=$1', [BOB]));
    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    assert.equal((await asUser(db, BOB, () => readNotifications(db))).items[0].created_at, renewedAt);
    await db.exec('update pico_private.social_intent_settings set enabled=false');
    assert.equal((await asUser(db, BOB, () => readNotifications(db))).items.length, 0, 'disabling the gate makes rollback safe');
    await db.exec('update pico_private.social_intent_settings set enabled=true');

    await asUser(db, ALICE, async () => {
      await assert.rejects(db.query("insert into public.notifications(recipient_id,actor_id,kind) values($1,$2,'new_follower')", [BOB, ALICE]));
    });
    await asUser(db, BOB, () => db.query('insert into public.blocks(blocked_id) values($1)', [ALICE]));
    assert.equal((await asUser(db, BOB, () => readNotifications(db))).items.length, 0);
    assert.equal((await db.query('select count(*)::int n from public.connections where follower_id in ($1,$2) and followed_id in ($1,$2)', [ALICE, BOB])).rows[0].n, 0);
  } finally {
    await db.close();
  }
});

test('a participant can report one received message and an operator sees only that evidence', async () => {
  const db = await createTestDatabase();
  try {
    await addCarol(db);
    await db.exec('update pico_private.direct_messages_settings set enabled=true');
    await mutual(db);
    const conversation = await asUser(db, ALICE, async () => (await db.query('select public.open_direct_conversation($1) r', [BOB])).rows[0].r);
    const message = await asUser(db, ALICE, async () => (await db.query('select public.send_direct_message($1,$2,$3) r', [conversation.id, randomUUID(), 'Mensagem que precisa de análise'])).rows[0].r);

    const report = await asUser(db, BOB, async () => (await db.query("select public.report_direct_message($1,'harassment','Contexto informado pela pessoa') id", [message.id])).rows[0]);
    assert.deepEqual(await asUser(db, BOB, async () => (await db.query("select public.report_direct_message($1,'spam','Outro texto') id", [message.id])).rows[0]), report);
    assert.equal((await db.query('select count(*)::int n from public.reports where message_id=$1', [message.id])).rows[0].n, 1);
    await asUser(db, ALICE, () => denied(db.query("select public.report_direct_message($1,'spam','')", [message.id])));
    await asUser(db, CAROL, () => denied(db.query("select public.report_direct_message($1,'spam','')", [message.id])));
    await asUser(db, BOB, () => denied(db.query("insert into public.reports(message_id,reason) values($1,'spam')", [message.id])));

    await db.query("insert into pico_private.platform_grants(player_id,role) values($1,'moderator')", [CAROL]);
    await asUser(db, CAROL, async () => {
      assert.equal((await db.query('select id from public.direct_messages')).rows.length, 0);
      const detail = (await db.query("select public.operator_read('report_detail',$1) r", [report.id])).rows[0].r;
      assert.equal(detail.message, 'Mensagem que precisa de análise');
      assert.equal(detail.message_author_id, ALICE);
      assert.equal(detail.conversation, undefined);
      assert.equal(detail.messages, undefined);
      await db.query("select public.moderate_report($1,'suspend')", [report.id]);
    });
    assert.equal((await db.query('select status from public.reports where id=$1', [report.id])).rows[0].status, 'action_taken');
    assert.equal((await db.query('select status from pico_private.beta_admissions where player_id=$1', [ALICE])).rows[0].status, 'suspended');
    await asUser(db, ALICE, () => denied(db.query('select public.send_direct_message($1,$2,$3)', [conversation.id, randomUUID(), 'Não deve sair'])));
    assert.equal((await db.query("select count(*)::int n from pico_private.audit_events where action='report.inspect' and target_id=$1", [report.id])).rows[0].n, 1);
    await db.exec('set role service_role');
    const exported = (await db.query('select public.export_account_messages($1) data', [BOB])).rows[0].data;
    await db.exec('reset role');
    assert.equal(exported.direct_message_reports[0].message_id, message.id);
    assert.equal(exported.direct_message_reports[0].reason, 'harassment');
    assert.equal(JSON.stringify(exported).includes(message.body), false);
  } finally {
    await db.close();
  }
});

test('a received message remains reportable after the DM gate closes or its sender blocks the recipient', async () => {
  const db = await createTestDatabase();
  try {
    await db.exec('update pico_private.direct_messages_settings set enabled=true');
    await mutual(db);
    const conversation = await asUser(db, ALICE, async () => (await db.query('select public.open_direct_conversation($1) r', [BOB])).rows[0].r);
    const beforePause = await asUser(db, ALICE, async () => (await db.query("select public.send_direct_message($1,gen_random_uuid(),'Antes da pausa') r", [conversation.id])).rows[0].r);
    const beforeBlock = await asUser(db, ALICE, async () => (await db.query("select public.send_direct_message($1,gen_random_uuid(),'Antes do bloqueio') r", [conversation.id])).rows[0].r);

    await db.exec('update pico_private.direct_messages_settings set enabled=false');
    const pausedReport = await asUser(db, BOB, async () => (await db.query("select public.report_direct_message($1,'unsafe','') id", [beforePause.id])).rows[0].id);
    await db.exec('update pico_private.direct_messages_settings set enabled=true');
    await asUser(db, ALICE, () => db.query('insert into public.blocks(blocked_id) values($1)', [BOB]));
    const blockedReport = await asUser(db, BOB, async () => (await db.query("select public.report_direct_message($1,'harassment','') id", [beforeBlock.id])).rows[0].id);

    assert.notEqual(pausedReport, blockedReport);
    assert.equal((await db.query('select count(*)::int n from public.reports where id in ($1,$2)', [pausedReport, blockedReport])).rows[0].n, 2);
    assert.equal((await db.query('select count(*)::int n from pico_private.message_report_evidence where report_id in ($1,$2)', [pausedReport, blockedReport])).rows[0].n, 2);
  } finally {
    await db.close();
  }
});

test('account deletion cannot erase a pending message report, and resolution erases only the copied body', async () => {
  const db = await createTestDatabase();
  try {
    await addCarol(db);
    await db.exec('update pico_private.direct_messages_settings set enabled=true');
    await mutual(db);
    const conversation = await asUser(db, ALICE, async () => (await db.query('select public.open_direct_conversation($1) r', [BOB])).rows[0].r);
    const message = await asUser(db, ALICE, async () => (await db.query("select public.send_direct_message($1,gen_random_uuid(),'Evidência pendente mínima') r", [conversation.id])).rows[0].r);
    const reportId = await asUser(db, BOB, async () => (await db.query("select public.report_direct_message($1,'unsafe','') id", [message.id])).rows[0].id);
    await db.query('delete from auth.users where id=$1', [ALICE]);
    assert.equal((await db.query('select count(*)::int n from public.direct_messages where id=$1', [message.id])).rows[0].n, 0);
    assert.equal((await db.query('select count(*)::int n from public.reports where id=$1', [reportId])).rows[0].n, 1);

    await db.query("insert into pico_private.platform_grants(player_id,role) values($1,'moderator')", [CAROL]);
    await asUser(db, CAROL, async () => {
      const detail = (await db.query("select public.operator_read('report_detail',$1) r", [reportId])).rows[0].r;
      assert.equal(detail.message, 'Evidência pendente mínima');
      assert.equal(detail.message_author_id, ALICE);
      await assert.rejects(
        db.query("select public.operator_action('review_report',null,$1,'dismissed')", [reportId]),
        error => error.code === '23514',
      );
      await denied(db.query("select public.operator_action_pre_social_safety('review_report',null,$1,'dismissed')", [reportId]));
      const stillPending = (await db.query("select public.operator_read('report_detail',$1) r", [reportId])).rows[0].r;
      assert.equal(stillPending.status, 'pending');
      assert.equal(stillPending.message, 'Evidência pendente mínima');
      await db.query("select public.moderate_report($1,'dismiss')", [reportId]);
      const resolved = (await db.query("select public.operator_read('report_detail',$1) r", [reportId])).rows[0].r;
      assert.equal(resolved.message, null);
      assert.equal(resolved.message_author_id, ALICE);
      assert.equal(new Date(resolved.message_created_at).toISOString(), new Date(message.created_at).toISOString());
    });
    const retained = (await db.query('select sender_id, body, message_created_at from pico_private.message_report_evidence where report_id=$1', [reportId])).rows[0];
    assert.equal(retained.sender_id, ALICE);
    assert.equal(retained.body, null);
    assert.equal(new Date(retained.message_created_at).toISOString(), new Date(message.created_at).toISOString());
    assert.equal((await db.query('select status from public.reports where id=$1', [reportId])).rows[0].status, 'dismissed');
    const audit = (await db.query("select target_id from pico_private.audit_events where action='report.dismiss' and scope_id=$1", [reportId])).rows[0];
    assert.equal(audit.target_id, ALICE);
  } finally {
    await db.close();
  }
});

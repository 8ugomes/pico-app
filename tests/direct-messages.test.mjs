import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB } from './helpers/database.mjs';

const CAROL = '30000000-0000-4000-8000-000000000003';
const denied = promise => assert.rejects(promise, error => error.code === '42501');
const invalid = promise => assert.rejects(promise, error => error.code === '23514');
const rpc = async (db, sql, params = []) => (await db.query(`select public.${sql} r`, params)).rows[0].r;
const open = (db, peer) => rpc(db, 'open_direct_conversation($1)', [peer]);
const inbox = (db, before = null) => rpc(db, 'read_direct_conversations($1)', [before]);
const thread = (db, id, before = null) => rpc(db, 'read_direct_messages($1,$2)', [id, before]);
const send = (db, id, body = 'Vamos conversar sobre o jogo?', key = randomUUID()) => rpc(db, 'send_direct_message($1,$2,$3)', [id, key, body]);
const mark = (db, id, through) => rpc(db, 'mark_direct_messages_read($1,$2)', [id, through]);

async function mutual(db, first = ALICE, second = BOB) {
  await asUser(db, first, () => db.query('insert into public.connections(followed_id) values($1) on conflict do nothing', [second]));
  await asUser(db, second, () => db.query('insert into public.connections(followed_id) values($1) on conflict do nothing', [first]));
}
async function fixture() {
  const db = await createTestDatabase();
  await db.query("insert into auth.users(id,email) values($1,'carol@example.invalid')", [CAROL]);
  assert.equal((await db.query('select enabled from pico_private.direct_messages_settings')).rows[0].enabled, false);
  await db.exec('update pico_private.direct_messages_settings set enabled=true');
  return db;
}

test('direct conversations require mutual follows and participant identity; empty opening never fabricates an inbox message', async () => {
  const db = await fixture();
  try {
    await asUser(db, null, () => denied(open(db, BOB)));
    await asUser(db, ALICE, () => denied(open(db, BOB)));
    await asUser(db, ALICE, () => invalid(open(db, ALICE)));
    await asUser(db, ALICE, () => invalid(open(db, null)));
    await asUser(db, ALICE, () => denied(open(db, randomUUID())));
    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    await asUser(db, ALICE, () => denied(open(db, BOB)));
    await mutual(db);
    const conversation = await asUser(db, ALICE, () => open(db, BOB));
    assert.deepEqual(await asUser(db, BOB, () => open(db, ALICE)), conversation);
    assert.equal((await db.query('select count(*)::int n from public.direct_conversations')).rows[0].n, 1);
    assert.deepEqual((await asUser(db, BOB, () => inbox(db))).items, []);
    const message = await asUser(db, ALICE, () => send(db, conversation.id));
    assert.equal(message.sender_id, ALICE);
    assert.deepEqual(Object.keys(message).sort(), ['body', 'conversation_id', 'created_at', 'id', 'sender_id']);
    const bobInbox = await asUser(db, BOB, () => inbox(db));
    assert.equal(bobInbox.items.length, 1);
    assert.equal(bobInbox.items[0].peer.id, ALICE);
    assert.equal(bobInbox.items[0].last_message.id, message.id);
    assert.equal(bobInbox.unreadCount, 1);
    assert.equal(bobInbox.items[0].unread_count, 1);
    assert.equal((await asUser(db, ALICE, () => inbox(db))).unreadCount, 0);
    await asUser(db, CAROL, async () => {
      assert.deepEqual((await inbox(db)).items, []);
      for (const table of ['direct_conversations', 'direct_messages', 'direct_message_reads']) {
        assert.equal((await db.query(`select ${table === 'direct_messages' ? 'id' : '*'} from public.${table}`)).rows.length, 0);
        await denied(db.query(`delete from public.${table}`));
      }
      await denied(thread(db, conversation.id));
      await denied(send(db, conversation.id));
      await denied(mark(db, conversation.id, message.id));
      await denied(db.query('insert into public.direct_messages(conversation_id,sender_id,sequence,client_key,body) values($1,$2,2,$3,$4)', [conversation.id, BOB, randomUUID(), 'Forjada']));
      await denied(db.query('update public.direct_messages set body=$1', ['Forjada']));
    });
    await asUser(db, BOB, () => denied(db.query('select client_key from public.direct_messages')));
    await asUser(db, null, async () => {
      await denied(inbox(db));
      await denied(thread(db, conversation.id));
      await denied(db.query('select * from public.direct_messages'));
    });
  } finally { await db.close(); }
});

test('direct messages validate text, retry idempotently and reject reuse of a send key for changed content or another conversation', async () => {
  const db = await fixture();
  try {
    await mutual(db);
    await mutual(db, ALICE, CAROL);
    const first = await asUser(db, ALICE, () => open(db, BOB));
    const second = await asUser(db, ALICE, () => open(db, CAROL));
    const key = randomUUID();
    await asUser(db, ALICE, async () => {
      const message = await send(db, first.id, '  Olá, Pico!\n', key);
      assert.equal(message.body, 'Olá, Pico!');
      assert.deepEqual(await send(db, first.id, 'Olá, Pico!', key), message);
      await assert.rejects(send(db, first.id, 'Texto alterado', key), error => error.code === 'P0409');
      await assert.rejects(send(db, second.id, 'Olá, Pico!', key), error => error.code === 'P0409');
      for (const body of ['', ' \t\n\r ', 'x'.repeat(2001), null]) await invalid(send(db, first.id, body));
      await invalid(send(db, first.id, 'Mensagem', null));
      await invalid(send(db, null));
      const limit = await send(db, first.id, 'x'.repeat(2000));
      assert.equal(limit.body.length, 2000);
      await denied(db.query('update public.direct_messages set sender_id=$1,created_at=now() where id=$2', [BOB, message.id]));
    });
    assert.equal((await db.query('select count(*)::int n from public.direct_messages')).rows[0].n, 2);
    assert.equal((await db.query("select used from pico_private.write_limits where player_id=$1 and action='direct_message_minute'", [ALICE])).rows[0].used, 2);
  } finally { await db.close(); }
});

test('reading is explicit, private and monotonic; marking the displayed message leaves later arrivals unread', async () => {
  const db = await fixture();
  try {
    await mutual(db);
    await mutual(db, ALICE, CAROL);
    const conversation = await asUser(db, ALICE, () => open(db, BOB));
    const other = await asUser(db, ALICE, () => open(db, CAROL));
    const one = await asUser(db, BOB, () => send(db, conversation.id, 'Primeira'));
    const reply = await asUser(db, ALICE, () => send(db, conversation.id, 'Resposta'));
    const two = await asUser(db, BOB, () => send(db, conversation.id, 'Segunda'));
    const foreign = await asUser(db, CAROL, () => send(db, other.id, 'Outra conversa'));
    const page = await asUser(db, ALICE, () => thread(db, conversation.id));
    assert.deepEqual(page.items.map(message => message.id), [two.id, reply.id, one.id]);
    assert.equal(page.conversation.can_send, true);
    assert.equal(page.conversation.unread_count, 2);
    assert.equal((await asUser(db, ALICE, () => inbox(db))).unreadCount, 3);
    await asUser(db, ALICE, () => mark(db, conversation.id, one.id));
    assert.equal((await asUser(db, ALICE, () => thread(db, conversation.id))).conversation.unread_count, 1);
    assert.equal((await asUser(db, ALICE, () => inbox(db))).unreadCount, 2);
    const three = await asUser(db, BOB, () => send(db, conversation.id, 'Chegou depois da leitura'));
    await asUser(db, ALICE, () => mark(db, conversation.id, two.id));
    await asUser(db, ALICE, () => mark(db, conversation.id, one.id));
    assert.equal((await asUser(db, ALICE, () => thread(db, conversation.id))).conversation.unread_count, 1);
    assert.equal((await asUser(db, ALICE, () => inbox(db))).items.find(row => row.id === conversation.id).unread_count, 1);
    assert.equal((await asUser(db, BOB, () => inbox(db))).unreadCount, 1);
    await asUser(db, ALICE, async () => {
      await denied(mark(db, conversation.id, foreign.id));
      await denied(mark(db, conversation.id, randomUUID()));
      await invalid(mark(db, conversation.id, null));
      await denied(db.query('update public.direct_message_reads set last_read_sequence=9999'));
      await mark(db, conversation.id, three.id);
      assert.equal((await thread(db, conversation.id)).conversation.unread_count, 0);
      assert.equal((await db.query('select * from public.direct_message_reads')).rows.length, 1);
    });
    await asUser(db, BOB, async () => {
      assert.equal((await db.query('select * from public.direct_message_reads')).rows.length, 0);
    });
    assert.equal((await asUser(db, ALICE, () => inbox(db))).unreadCount, 1);
  } finally { await db.close(); }
});

test('unfollowing preserves history but revokes sending; blocks, inactive accounts and the database switch revoke access in both directions', async () => {
  const db = await fixture();
  try {
    await mutual(db);
    const conversation = await asUser(db, ALICE, () => open(db, BOB));
    const first = await asUser(db, ALICE, () => send(db, conversation.id));
    await asUser(db, BOB, () => db.query('delete from public.connections where followed_id=$1', [ALICE]));
    assert.equal((await asUser(db, ALICE, () => thread(db, conversation.id))).conversation.can_send, false);
    assert.equal((await asUser(db, BOB, () => thread(db, conversation.id))).items.length, 1);
    assert.deepEqual(await asUser(db, ALICE, () => open(db, BOB)), conversation);
    for (const who of [ALICE, BOB]) await asUser(db, who, () => denied(send(db, conversation.id)));
    await mutual(db);
    for (const [blocker, blocked] of [[ALICE, BOB], [BOB, ALICE]]) {
      await asUser(db, blocker, () => db.query('insert into public.blocks(blocked_id) values($1)', [blocked]));
      for (const who of [ALICE, BOB]) await asUser(db, who, async () => {
        assert.deepEqual(await inbox(db), { items: [], nextCursor: null, unreadCount: 0 });
        assert.equal((await db.query('select id from public.direct_messages')).rows.length, 0);
        await denied(thread(db, conversation.id));
        await denied(send(db, conversation.id));
        await denied(mark(db, conversation.id, first.id));
      });
      await asUser(db, blocker, () => db.query('delete from public.blocks where blocked_id=$1', [blocked]));
      assert.equal((await asUser(db, ALICE, () => thread(db, conversation.id))).conversation.can_send, false);
      await mutual(db);
    }
    await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1", [BOB]);
    await asUser(db, ALICE, async () => { assert.equal((await inbox(db)).items.length, 0); await denied(thread(db, conversation.id)); });
    await asUser(db, BOB, () => denied(inbox(db)));
    await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1", [BOB]);
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [BOB]);
    // Target visibility follows the existing social admission helper; this
    // feature does not introduce a new email-confirmation rule for recipients.
    assert.equal((await asUser(db, ALICE, () => thread(db, conversation.id))).items.length, 1);
    await asUser(db, BOB, () => denied(thread(db, conversation.id)));
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [BOB]);
    await db.query('insert into public.account_deletions(player_id) values($1)', [BOB]);
    await asUser(db, ALICE, () => denied(send(db, conversation.id)));
    await asUser(db, BOB, () => denied(thread(db, conversation.id)));
    await db.query('delete from public.account_deletions where player_id=$1', [BOB]);
    await db.exec('update pico_private.direct_messages_settings set enabled=false');
    for (const who of [ALICE, BOB]) await asUser(db, who, async () => {
      await denied(inbox(db));
      await denied(thread(db, conversation.id));
      await denied(send(db, conversation.id));
      await denied(open(db, who === ALICE ? BOB : ALICE));
      await denied(mark(db, conversation.id, first.id));
      assert.equal((await db.query('select id from public.direct_messages')).rows.length, 0);
      await denied(db.query('update pico_private.direct_messages_settings set enabled=true'));
    });
  } finally { await db.close(); }
});

test('message cursors are stable across equal timestamps and cannot cross conversations', async () => {
  const db = await fixture();
  try {
    await mutual(db);
    await mutual(db, ALICE, CAROL);
    const conversation = await asUser(db, ALICE, () => open(db, BOB));
    const other = await asUser(db, ALICE, () => open(db, CAROL));
    // Controlled historical rows in the disposable SQL database, with deliberately equal dates.
    await db.query(`insert into public.direct_messages(conversation_id,sender_id,sequence,client_key,body,created_at)
      select $1,$2,n,gen_random_uuid(),'Mensagem '||n,'2026-09-18T12:00:00Z'::timestamptz from generate_series(1,65) n`, [conversation.id, BOB]);
    await db.query("update public.direct_conversations set last_sequence=65,last_message_at='2026-09-18T12:00:00Z' where id=$1", [conversation.id]);
    const foreign = await asUser(db, CAROL, () => send(db, other.id));
    await asUser(db, ALICE, async () => {
      const first = await thread(db, conversation.id);
      const second = await thread(db, conversation.id, first.nextCursor);
      const third = await thread(db, conversation.id, second.nextCursor);
      assert.deepEqual([first.items.length, second.items.length, third.items.length], [30, 30, 5]);
      assert.equal(third.nextCursor, null);
      const messages = [...first.items, ...second.items, ...third.items];
      assert.equal(new Set(messages.map(message => message.id)).size, 65);
      assert.deepEqual(messages.map(message => Number(message.body.split(' ')[1])), Array.from({ length: 65 }, (_, index) => 65 - index));
      await denied(thread(db, conversation.id, foreign.id));
      await denied(thread(db, conversation.id, randomUUID()));
      assert.equal((await inbox(db)).unreadCount, 66);
    });
    await asUser(db, CAROL, () => denied(thread(db, conversation.id)));
  } finally { await db.close(); }
});

test('inbox pagination anchors an immutable message even when its conversation receives another message', async () => {
  const db = await fixture();
  try {
    // Bulk history is fixture data, not messages sent to real accounts.
    await db.exec(`
      insert into auth.users(id,email) select gen_random_uuid(),'dm-page-'||n||'@example.invalid' from generate_series(1,25) n;
      insert into public.connections(follower_id,followed_id) select '${ALICE}',id from auth.users where email like 'dm-page-%';
      insert into public.connections(follower_id,followed_id) select id,'${ALICE}' from auth.users where email like 'dm-page-%';
      insert into public.direct_conversations(participant_low,participant_high)
        select least(id,'${ALICE}'::uuid),greatest(id,'${ALICE}'::uuid) from auth.users where email like 'dm-page-%';
      insert into public.direct_messages(conversation_id,sender_id,sequence,client_key,body,created_at)
        select id,case when participant_low='${ALICE}' then participant_high else participant_low end,1,gen_random_uuid(),'Conversa de teste','2026-09-18T12:00:00Z'
        from public.direct_conversations;
      update public.direct_conversations set last_sequence=1,last_message_at='2026-09-18T12:00:00Z';
    `);
    const first = await asUser(db, ALICE, () => inbox(db));
    assert.equal(first.items.length, 20);
    assert.equal(first.unreadCount, 25);
    assert.equal(first.nextCursor, first.items[19].last_message.id);
    await asUser(db, ALICE, () => send(db, first.items[19].id, 'Mensagem posterior ao cursor'));
    const second = await asUser(db, ALICE, () => inbox(db, first.nextCursor));
    assert.equal(second.items.length, 5);
    assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 25);
    await asUser(db, BOB, () => denied(inbox(db, first.nextCursor)));
    await asUser(db, ALICE, () => denied(inbox(db, randomUUID())));
  } finally { await db.close(); }
});

test('send limits are transactional and idempotent retries remain available at the limit', async () => {
  const db = await fixture();
  try {
    await mutual(db);
    await mutual(db, ALICE, CAROL);
    const conversation = await asUser(db, ALICE, () => open(db, BOB));
    const key = randomUUID();
    const first = await asUser(db, ALICE, () => send(db, conversation.id, 'Confirmar uma única vez', key));
    await db.query("update pico_private.write_limits set used=30 where player_id=$1 and action='direct_message_minute'", [ALICE]);
    // The hourly boundary backs up the minute boundary if wall time advances
    // during the assertion; an unchanged retry consumes neither counter.
    await db.query("update pico_private.write_limits set used=600 where player_id=$1 and action='direct_message_hour'", [ALICE]);
    await asUser(db, ALICE, async () => {
      await assert.rejects(send(db, conversation.id), error => error.code === 'P0429');
      assert.deepEqual(await send(db, conversation.id, 'Confirmar uma única vez', key), first);
    });
    assert.equal((await db.query('select last_sequence::int n from public.direct_conversations where id=$1', [conversation.id])).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int n from public.direct_messages')).rows[0].n, 1);
    await db.query("update pico_private.write_limits set used=20 where player_id=$1 and action='direct_conversation'", [ALICE]);
    await asUser(db, ALICE, async () => {
      assert.deepEqual(await open(db, BOB), conversation);
      await assert.rejects(open(db, CAROL), error => error.code === 'P0429');
    });
  } finally { await db.close(); }
});

test('account export includes only the subject writing; deleting either participant removes the whole private conversation', async () => {
  const db = await fixture();
  try {
    await mutual(db);
    const conversation = await asUser(db, ALICE, () => open(db, BOB));
    const sent = await asUser(db, ALICE, () => send(db, conversation.id, 'Minha escrita'));
    const received = await asUser(db, BOB, () => send(db, conversation.id, 'Texto privado da outra pessoa'));
    await asUser(db, ALICE, () => mark(db, conversation.id, received.id));
    await asUser(db, ALICE, () => denied(rpc(db, 'export_account_messages($1)', [ALICE])));
    await asUser(db, null, () => denied(rpc(db, 'export_account_messages($1)', [ALICE])));
    await db.exec('set role service_role');
    const exported = await rpc(db, 'export_account_messages($1)', [ALICE]);
    await db.exec('reset role');
    assert.equal(exported.direct_messages_sent.length, 1);
    assert.equal(exported.direct_messages_sent[0].id, sent.id);
    assert.equal(exported.direct_messages_sent[0].body, 'Minha escrita');
    assert.equal(JSON.stringify(exported).includes(received.body), false);
    await db.query('delete from auth.users where id=$1', [BOB]);
    for (const table of ['direct_conversations', 'direct_messages', 'direct_message_reads']) {
      assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n, 0);
    }
  } finally { await db.close(); }
});

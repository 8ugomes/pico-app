import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, asUser, ALICE, BOB } from './helpers/database.mjs';

const endpoint = who => 'https://fcm.googleapis.com/fcm/send/' + who + ':APA-test';
const subscribe = (db, who, url = endpoint(who)) => asUser(db, who, () => db.query('select public.save_push_subscription($1,$2,$3)', [url, 'B'.repeat(87), 'A'.repeat(22)]));
const status = (db, who, url = endpoint(who)) => asUser(db, who, async () => (await db.query('select public.read_push_subscription($1) r', [url])).rows[0].r);
const enabled = db => db.exec('update pico_private.push_settings set enabled=true');
const group = db => asUser(db, ALICE, async () => (await db.query('select public.create_community($1) r', [{ name: 'Push Teste', sports: [], visibility: 'private', entry_mode: 'open' }])).rows[0].r);
const join = (db, id) => asUser(db, BOB, () => db.query("select public.community_membership($1,'join')", [id]));
async function worker(db, run) { await db.exec('set role service_role'); try { return await run(); } finally { await db.exec('reset role'); } }
const claim = db => worker(db, async () => (await db.query('select * from public.claim_push_batch(20)')).rows);
const delivery = (db, job) => worker(db, async () => (await db.query('select public.read_push_delivery($1,$2) r', [job.job_id, job.lease_token])).rows[0].r);
const finish = (db, job, outcome) => worker(db, () => db.query('select public.finish_push_delivery($1,$2,$3)', [job.job_id, job.lease_token, outcome]));

test('push gates raw RPC, keeps endpoints private, caps devices and forbids account reassignment', async () => {
  const db = await createTestDatabase();
  try {
    await assert.rejects(subscribe(db, ALICE));
    assert.equal((await status(db, ALICE)).enabled, false);
    await enabled(db); await subscribe(db, ALICE); await subscribe(db, ALICE);
    assert.equal((await status(db, ALICE)).subscribed, true);
    assert.equal((await status(db, BOB, endpoint(ALICE))).subscribed, false);
    await assert.rejects(subscribe(db, BOB, endpoint(ALICE)));
    await asUser(db, BOB, () => db.query('select public.delete_push_subscription($1)', [endpoint(ALICE)]));
    assert.equal((await status(db, ALICE)).subscribed, true);
    await asUser(db, ALICE, async () => {
      await assert.rejects(db.query('select * from pico_private.push_subscriptions'));
      await assert.rejects(db.query('select * from pico_private.push_outbox'));
      await assert.rejects(db.query('select * from public.claim_push_batch(20)'));
      await assert.rejects(db.query('select public.read_push_delivery(gen_random_uuid(),gen_random_uuid())'));
      await assert.rejects(db.query('update pico_private.push_settings set enabled=true'));
    });
    await asUser(db, null, () => assert.rejects(db.query('select public.read_push_subscription()')));
    await assert.rejects(subscribe(db, ALICE, 'https://fcm.googleapis.com:443/fcm/send/invalid'));
    for (let i = 0; i < 4; i++) await subscribe(db, ALICE, endpoint('device-' + i));
    await assert.rejects(subscribe(db, ALICE, endpoint('sixth')));
    await db.exec('update pico_private.push_settings set enabled=false');
    await asUser(db, ALICE, () => db.query('select public.delete_push_subscription($1)', [endpoint(ALICE)]));
    assert.equal((await status(db, ALICE)).subscribed, false);
  } finally { await db.close(); }
});

test('push is only queued after consent and rechecks blocks, read state, admission and gate before delivery', async () => {
  const db = await createTestDatabase();
  try {
    const g = await group(db); await join(db, g.id);
    await enabled(db); await subscribe(db, ALICE);
    assert.equal((await claim(db)).length, 0); // No historic inbox backfill.
    const add = async () => db.query('insert into public.notifications(recipient_id,actor_id,community_id) values($1,$2,$3)', [ALICE, BOB, g.id]);
    await add();
    let [job] = await claim(db);
    assert.ok(job);
    assert.equal((await claim(db)).length, 0); // Lease also excludes other events for the device.
    const value = await delivery(db, job);
    assert.equal(value.kind, 'community'); assert.ok(value.ttl <= 300);
    assert.equal('actor' in value, false); assert.equal('body' in value, false);
    await asUser(db, ALICE, () => db.query('insert into public.blocks(blocked_id) values($1)', [BOB]));
    assert.equal(await delivery(db, job), null);
    await asUser(db, ALICE, () => db.query('delete from public.blocks where blocked_id=$1', [BOB]));
    await add(); [job] = await claim(db);
    await asUser(db, ALICE, () => db.query('select public.mark_all_notifications_read()'));
    assert.equal(await delivery(db, job), null);
    await add(); [job] = await claim(db);
    await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1", [BOB]);
    assert.equal(await delivery(db, job), null);
    await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1", [BOB]);
    await add(); [job] = await claim(db);
    await db.exec('update pico_private.push_settings set enabled=false');
    assert.equal(await delivery(db, job), null);
    await add(); assert.equal((await claim(db)).length, 0);
  } finally { await db.close(); }
});

test('push leases, backoff, coalescing, stale receipts and endpoint expiry are bounded', async () => {
  const db = await createTestDatabase();
  try {
    await enabled(db); await subscribe(db, ALICE);
    const g = await group(db); await join(db, g.id);
    await db.query('insert into public.notifications(recipient_id,actor_id,community_id) select $1,$2,$3 from generate_series(1,3)', [ALICE, BOB, g.id]);
    const [first] = await claim(db);
    await finish(db, { ...first, lease_token: '30000000-0000-4000-8000-000000000099' }, 'sent');
    assert.ok(await delivery(db, first));
    await finish(db, first, 'retry');
    assert.equal((await claim(db)).length, 0);
    await db.exec("update pico_private.push_outbox set available_at=now()-interval '1 second' where status='pending'");
    await db.exec("update pico_private.push_subscriptions set delivery_lease_until=now()-interval '1 second'");
    const [second] = await claim(db);
    assert.notEqual(second.lease_token, first.lease_token);
    await finish(db, first, 'sent'); // Old worker cannot finish the renewed lease.
    assert.ok(await delivery(db, second));
    await finish(db, second, 'sent');
    assert.equal((await db.query("select count(*)::int n from pico_private.push_outbox where status='pending'")).rows[0].n, 0);
    assert.equal((await db.query("select count(*)::int n from pico_private.push_outbox where status='sent'")).rows[0].n, 1);
    await db.query('insert into public.notifications(recipient_id,actor_id,community_id) values($1,$2,$3)', [ALICE, BOB, g.id]);
    assert.equal((await claim(db)).length, 0); // At most one generic alert per minute/device.
    await db.exec("update pico_private.push_subscriptions set last_delivered_at=now()-interval '2 minutes'");
    const [expired] = await claim(db); await finish(db, expired, 'gone');
    assert.equal((await status(db, ALICE)).subscribed, false);
    assert.equal((await db.query('select count(*)::int n from pico_private.push_outbox')).rows[0].n, 0);
  } finally { await db.close(); }
});

test('direct message push only targets the peer and suppresses read messages and revoked relationships', async () => {
  const db = await createTestDatabase();
  try {
    await enabled(db); await db.exec('update pico_private.direct_messages_settings set enabled=true');
    await subscribe(db, ALICE); await subscribe(db, BOB);
    await db.query('insert into public.connections(follower_id,followed_id) values($1,$2),($2,$1)', [ALICE, BOB]);
    const conversation = await asUser(db, ALICE, async () => (await db.query('select public.open_direct_conversation($1) r', [BOB])).rows[0].r);
    const send = () => asUser(db, ALICE, async () => (await db.query("select public.send_direct_message($1,gen_random_uuid(),'Mensagem privada de teste') r", [conversation.id])).rows[0].r);
    await send();
    let jobs = await claim(db); assert.equal(jobs.length, 1);
    assert.equal((await delivery(db, jobs[0])).endpoint, endpoint(BOB));
    assert.equal((await delivery(db, jobs[0])).kind, 'message');
    await db.query('insert into public.direct_message_reads(conversation_id,player_id,last_read_sequence) values($1,$2,1)', [conversation.id, BOB]);
    assert.equal(await delivery(db, jobs[0]), null);
    await send(); jobs = await claim(db);
    await db.query('delete from public.connections where follower_id=$1 and followed_id=$2', [BOB, ALICE]);
    assert.equal(await delivery(db, jobs[0]), null);
    await db.query('insert into public.connections(follower_id,followed_id) values($1,$2)', [BOB, ALICE]);
    await send(); jobs = await claim(db);
    await db.exec("update pico_private.push_outbox set expires_at=now()-interval '1 second' where status='processing'");
    assert.equal(await delivery(db, jobs[0]), null);
    await send(); jobs = await claim(db);
    await asUser(db, BOB, () => db.query('select public.delete_push_subscription($1)', [endpoint(BOB)]));
    assert.equal(await delivery(db, jobs[0]), null);
  } finally { await db.close(); }
});

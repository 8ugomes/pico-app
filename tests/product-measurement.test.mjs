import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestDatabase, asUser, ALICE, BOB, VILA } from './helpers/database.mjs';
import { executeMeasurementWrite } from '../src/lib/product-measurement-rpc.ts';

const COMMUNITY = '40000000-0000-4000-8000-000000000001';
const CHARLIE = '30000000-0000-4000-8000-000000000003';
const TEST_RELEASE = 'test-release-20260928';
const NEXT_TEST_RELEASE = 'test-release-20260929';
const METRIC_INVITES = [1, 2, 3, 4, 5].map(value => `50000000-0000-4000-8000-${String(value).padStart(12, '0')}`);
const METRIC_USERS = [11, 12, 13, 14, 15].map(value => `30000000-0000-4000-8000-${String(value).padStart(12, '0')}`);
const EXPORT_INVITES = [21, 22, 23].map(value => `50000000-0000-4000-8000-${String(value).padStart(12, '0')}`);

async function asService(db, run) {
  await db.exec('set role service_role');
  try { return await run(db); }
  finally { await db.exec('reset role'); }
}

async function enableMeasurement(db, { stale = false, staleHours = stale ? 27 : 1, startedDays = 2 } = {}) {
  await db.exec('delete from pico_private.product_measurement_settings');
    await db.query(`insert into pico_private.product_measurement_settings(
      singleton,retention_days,approved_at,approved_by,collection_started_at,first_enabled_at,expected_edge_release,
      purge_verified_at,purge_verified_by,last_purged_at)
    values(true,90,clock_timestamp()-make_interval(days=>$2+1),$1,
      clock_timestamp()-make_interval(days=>$2),clock_timestamp()-make_interval(days=>$2),$4,
      clock_timestamp()-make_interval(days=>$2+1),$1,
      clock_timestamp()-make_interval(hours=>$3))`, [ALICE, startedDays, staleHours, TEST_RELEASE]);
  await asService(db, () => db.query(
    'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
  ));
  await db.exec('update pico_private.product_measurement_settings set enabled=true');
}

async function localDates(db) {
  return (await db.query(`select
    to_char((clock_timestamp() at time zone 'America/Sao_Paulo')::date-1,'YYYY-MM-DD') report_day,
    to_char((clock_timestamp() at time zone 'America/Sao_Paulo')::date,'YYYY-MM-DD') today`)).rows[0];
}

async function snapshot(db, start, end = start) {
  return asService(db, async () => (await db.query(
    `select public.product_metrics_snapshot($1::date,$2::date,'America/Sao_Paulo') data`,
    [start, end],
  )).rows[0].data);
}

async function recordEvent(db, actor, eventType, contextType = null, contextId = null, release = TEST_RELEASE) {
  return (await db.query(
    'select public.record_product_event($1::uuid,$2::text,$3::text,$4::text,$5::uuid) value',
    [actor, eventType, release, contextType, contextId],
  )).rows[0].value;
}

async function createOwnedCommunity(db) {
  await db.query(`insert into public.communities(id,slug,owner_id,name,entry_mode,visibility)
    values($1,'medicao-segura',$2,'Medição segura','invite','private')
    on conflict(id) do update set owner_id=excluded.owner_id,status='active'`, [COMMUNITY, ALICE]);
}

async function resultOrErrorCode(run) {
  try { return await run(); }
  catch (error) { return error.code; }
}

test('approval, immutable start, purge verification and a fresh heartbeat jointly gate collection', async () => {
  const db = await createTestDatabase();
  try {
    assert.deepEqual(
      (await db.query(`select enabled,retention_days,approved_at,collection_started_at,
        purge_verified_at,last_purged_at from pico_private.product_measurement_settings`)).rows[0],
      { enabled: false, retention_days: null, approved_at: null, collection_started_at: null,
        purge_verified_at: null, last_purged_at: null },
    );
    await assert.rejects(
      db.exec('update pico_private.product_measurement_settings set enabled=true'),
      error => error.code === '23514',
    );
    assert.equal(await asService(db, () => recordEvent(db, ALICE, 'discovery_opened', 'profile')), false);

    await db.exec('delete from pico_private.product_measurement_settings');
    const missing = await snapshot(db, (await localDates(db)).report_day);
    assert.deepEqual({ status: missing.status, reason: missing.reason },
      { status: 'disabled', reason: 'privacy_gate_closed' });
    await db.query(`insert into pico_private.product_measurement_settings(
      singleton,retention_days,approved_at,approved_by,collection_started_at,first_enabled_at,expected_edge_release,
      purge_verified_at,purge_verified_by,last_purged_at)
      values(true,90,clock_timestamp()+interval '1 hour',$1,clock_timestamp()+interval '2 hours',
        clock_timestamp()+interval '2 hours',$2,clock_timestamp()+interval '1 hour',$1,clock_timestamp())`,
    [ALICE, TEST_RELEASE]);
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    await db.exec('update pico_private.product_measurement_settings set enabled=true');
    assert.equal((await db.query('select pico_private.product_measurement_enabled() value')).rows[0].value, false);
    const future = await snapshot(db, (await localDates(db)).report_day);
    assert.deepEqual({ status: future.status, reason: future.reason },
      { status: 'disabled', reason: 'approval_not_active' });

    await enableMeasurement(db, { stale: true, staleHours: 52, startedDays: 10 });
    const stale = await snapshot(db, (await localDates(db)).report_day);
    assert.deepEqual({ status: stale.status, reason: stale.reason },
      { status: 'disabled', reason: 'retention_maintenance_stale' });
    assert.equal(await asService(db, () => recordEvent(db, ALICE, 'discovery_opened', 'profile')), false);

    await db.exec(`update pico_private.product_measurement_settings set last_purged_at=clock_timestamp()+interval '1 hour'`);
    assert.equal((await db.query('select pico_private.product_measurement_enabled() value')).rows[0].value, false);
    assert.equal((await snapshot(db, (await localDates(db)).report_day)).reason, 'retention_maintenance_stale');

    await db.exec(`update pico_private.product_measurement_settings set last_purged_at=clock_timestamp()-interval '52 hours'`);
    await db.query(`insert into pico_private.product_events(actor_id,event_type,context_type,event_key,occurred_at)
      values($1,'discovery_opened','profile','2000-01-01',clock_timestamp()-interval '91 days')`, [ALICE]);
    await db.exec(`update pico_private.product_measurement_settings set enabled=false`);
    assert.equal(await asService(db, async () => (await db.query('select public.purge_product_events() removed')).rows[0].removed), 1);
    await db.exec(`update pico_private.product_measurement_settings set enabled=true`);
    assert.equal((await db.query('select pico_private.product_measurement_enabled() value')).rows[0].value, true);
    assert.deepEqual((await db.query(`select reason from pico_private.product_measurement_gaps order by reason`)).rows,
      [{ reason: 'disabled' }, { reason: 'retention_heartbeat' }]);
    const incomplete = await snapshot(db, (await localDates(db)).report_day);
    assert.deepEqual({ status: incomplete.status, reason: incomplete.reason, hasBase: incomplete.hasBase },
      { status: 'incomplete', reason: 'collection_gap', hasBase: false });
    assert.equal(await asService(db, () => recordEvent(db, ALICE, 'discovery_opened', 'profile')), true);

    await assert.rejects(
      db.exec(`update pico_private.product_measurement_settings
        set collection_started_at=collection_started_at-interval '1 day'`),
      error => error.code === '23514',
    );
    await assert.rejects(
      db.exec('update pico_private.product_measurement_settings set retention_days=180'),
      error => error.code === '23514',
    );
    await assert.rejects(
      db.query('update pico_private.product_measurement_settings set expected_edge_release=$1', [NEXT_TEST_RELEASE]),
      error => error.code === '23514',
    );
    await db.exec('update pico_private.product_measurement_settings set enabled=false');
    await db.query('update pico_private.product_measurement_settings set expected_edge_release=$1', [NEXT_TEST_RELEASE]);
    await assert.rejects(
      db.exec('update pico_private.product_measurement_settings set enabled=true'),
      error => error.code === '23514',
    );
    assert.equal((await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2) value', [1, TEST_RELEASE],
    ))).rows[0].value, false);
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, NEXT_TEST_RELEASE],
    ));
    await db.exec('update pico_private.product_measurement_settings set enabled=true');
    assert.equal((await db.query('select pico_private.product_measurement_enabled() value')).rows[0].value, true);
  } finally { await db.close(); }
});

test('request-edge lease blocks activation and records only intersecting ingestion gaps', async () => {
  const db = await createTestDatabase();
  try {
    await db.exec('delete from pico_private.product_measurement_settings');
    await db.query(`insert into pico_private.product_measurement_settings(
        singleton,retention_days,approved_at,approved_by,collection_started_at,expected_edge_release,
        purge_verified_at,purge_verified_by,last_purged_at)
      values(true,90,clock_timestamp()-interval '5 days',$1,clock_timestamp()-interval '4 days',$2,
        clock_timestamp()-interval '5 days',$1,clock_timestamp()-interval '1 hour')`, [ALICE, TEST_RELEASE]);
    await assert.rejects(
      db.exec('update pico_private.product_measurement_settings set enabled=true'),
      error => error.code === '23514' && /request-edge/i.test(error.message),
    );
    await asService(db, () => assert.rejects(
      db.query('select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [2, TEST_RELEASE]),
      error => error.code === '23514',
    ));
    assert.equal((await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2) value', [1, 'old-release-20260927'],
    ))).rows[0].value, false);
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    await db.exec('update pico_private.product_measurement_settings set enabled=true');
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_measurement_gaps
      where source='database' and reason='disabled' and ended_at is not null`)).rows[0].count, 1);
    await db.exec(`delete from pico_private.product_measurement_gaps where source='database'`);

    const { report_day: reportDay } = await localDates(db);
    const previousDay = (await db.query(`select to_char($1::date-1,'YYYY-MM-DD') value`, [reportDay])).rows[0].value;
    await db.query(`update pico_private.product_measurement_edge_state set
      lease_until=($1::date+time '12:00') at time zone 'America/Sao_Paulo'`, [reportDay]);
    assert.equal(await asService(db, () => recordEvent(db, ALICE, 'discovery_opened', 'profile')), false);
    assert.equal(await asService(db, () => recordEvent(db, ALICE, 'discovery_opened', 'profile')), false);
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_measurement_gaps
      where source='request_edge'`)).rows[0].count, 0);
    assert.equal((await snapshot(db, previousDay)).status, 'ready');

    await db.exec('update pico_private.product_measurement_settings set enabled=false');
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    await db.exec('update pico_private.product_measurement_settings set enabled=true');
    const interrupted = await snapshot(db, reportDay);
    assert.deepEqual({ status: interrupted.status, reason: interrupted.reason, hasBase: interrupted.hasBase },
      { status: 'incomplete', reason: 'request_edge_gap', hasBase: false });
    await asService(db, async () => {
      await db.query('select public.heartbeat_product_measurement_edge(false,$1::smallint,$2)', [1, TEST_RELEASE]);
      await db.query('select public.heartbeat_product_measurement_edge(false,$1::smallint,$2)', [1, TEST_RELEASE]);
    });
    assert.deepEqual((await db.query(`select reason,count(*)::int count
      from pico_private.product_measurement_gaps
      where source='request_edge' and ended_at is null group by reason`)).rows,
    [{ reason: 'request_edge_disabled', count: 1 }]);
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_measurement_gaps
      where source='request_edge' and ended_at is null`)).rows[0].count, 0);

    await db.exec(`delete from pico_private.product_measurement_gaps where source='request_edge'`);
    await db.exec(`update pico_private.product_measurement_edge_state set
      configured_enabled=true,lease_until=clock_timestamp()-interval '2 hours'`);
    await db.exec('update pico_private.product_measurement_settings set enabled=false');
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(false,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_measurement_gaps
      where source='request_edge' and reason='request_edge_heartbeat' and ended_at is not null`)).rows[0].count, 1);

    await db.exec(`delete from pico_private.product_measurement_gaps where source='request_edge'`);
    await db.exec(`update pico_private.product_measurement_edge_state set
      configured_enabled=true,lease_until=clock_timestamp()-interval '2 hours'`);
    await asService(db, () => db.query('select public.mark_product_measurement_edge_failure()'));
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_measurement_gaps
      where source='request_edge' and reason='request_edge_heartbeat' and ended_at is not null`)).rows[0].count, 1);

    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    await db.exec('update pico_private.product_measurement_settings set enabled=true');
    await db.exec(`delete from pico_private.product_measurement_gaps where source='request_edge'`);
    assert.equal(await asService(db, () => recordEvent(
      db, ALICE, 'share_prepared', 'arena', null, NEXT_TEST_RELEASE,
    )), false);
    assert.deepEqual((await db.query(`select configured_enabled,release,lease_until<=clock_timestamp() expired
      from pico_private.product_measurement_edge_state`)).rows[0],
    { configured_enabled: false, release: TEST_RELEASE, expired: true });
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_measurement_gaps
      where source='request_edge' and reason='request_edge_failure' and ended_at is null`)).rows[0].count, 1);
    assert.equal(await asService(db, () => recordEvent(db, ALICE, 'share_prepared', 'arena')), false);
    await asService(db, () => db.query(
      'select public.heartbeat_product_measurement_edge(true,$1::smallint,$2)', [1, TEST_RELEASE],
    ));
    assert.equal((await db.query('select pico_private.product_measurement_enabled() value')).rows[0].value, true);
  } finally { await db.close(); }
});

test('profile completion stays private, retained and deduplicated without changing profile mutability', async () => {
  const db = await createTestDatabase();
  try {
    assert.equal((await db.query(`select count(*)::int count from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='onboarding_completed_at'`)).rows[0].count, 0);
    assert.equal((await db.query(`select onboarding_completed
      from public.profiles where id=$1`, [ALICE])).rows[0].onboarding_completed, false);

    await db.query('update public.profiles set onboarding_completed=true where id=$1', [BOB]);
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_events
      where actor_id=$1 and event_type='profile_completed'`, [BOB])).rows[0].count, 0);

    await enableMeasurement(db);
    await db.query('update public.profiles set onboarding_completed=true where id=$1', [ALICE]);
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_events
      where actor_id=$1 and event_type='profile_completed'`, [ALICE])).rows[0].count, 1);
    await db.query('update public.profiles set onboarding_completed=false where id=$1', [ALICE]);
    assert.equal((await db.query(`select onboarding_completed from public.profiles where id=$1`, [ALICE])).rows[0].onboarding_completed, false);
    await db.query('update public.profiles set onboarding_completed=true where id=$1', [ALICE]);
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_events
      where actor_id=$1 and event_type='profile_completed'`, [ALICE])).rows[0].count, 1);

    await db.query(`insert into auth.users(id,email) values($1,'charlie@example.invalid')`, [CHARLIE]);
    await db.query(`insert into pico_private.product_measurement_exclusions(player_id,reason) values($1,'test')`, [CHARLIE]);
    await db.query('update public.profiles set onboarding_completed=true where id=$1', [CHARLIE]);
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_events
      where actor_id=$1 and event_type='profile_completed'`, [CHARLIE])).rows[0].count, 0);
    await asUser(db, ALICE, () => assert.rejects(
      db.query('select * from pico_private.product_events'),
      error => error.code === '42501',
    ));

    await db.query(`insert into pico_private.platform_grants(player_id,role) values($1,'moderator')
      on conflict(player_id) do update set role='moderator'`, [BOB]);
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [BOB]);
    await asService(db, () => db.query('select public.bootstrap_operator($1)', [BOB]));
    assert.equal((await db.query(`select role from pico_private.platform_grants where player_id=$1`, [BOB])).rows[0].role, 'admin');
  } finally { await db.close(); }
});

test('event RPC derives dedupe keys, retains no target context and survives an N-1 export caller', async () => {
  const db = await createTestDatabase();
  try {
    await enableMeasurement(db);
    await db.query('update public.profiles set onboarding_completed=true where id=$1', [ALICE]);
    await asService(db, async () => {
      assert.equal(await recordEvent(db, ALICE, 'discovery_opened', 'profile'), true);
      assert.equal(await recordEvent(db, ALICE, 'discovery_opened', 'profile'), false);
      assert.equal(await recordEvent(db, ALICE, 'share_prepared', 'profile'), true);
      await assert.rejects(
        recordEvent(db, ALICE, 'discovery_opened', 'profile', BOB),
        error => error.code === '23514',
      );
      await assert.rejects(
        recordEvent(db, ALICE, 'return_active', 'profile'),
        error => error.code === '23514',
      );
      await assert.rejects(
        recordEvent(db, ALICE, 'profile_completed'),
        error => error.code === '23514',
      );
      await assert.rejects(
        db.query(`select public.record_product_event($1::uuid,'discovery_opened',$2::text,'attacker-key','profile',$3::uuid)`,
          [ALICE, TEST_RELEASE, BOB]),
        error => error.code === '42883',
      );
    });

    await asUser(db, ALICE, () => db.query('insert into public.connections(followed_id) values($1)', [BOB]));
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_events
      where event_type='social_activated'`)).rows[0].count, 0);
    await asUser(db, BOB, () => db.query('insert into public.connections(followed_id) values($1)', [ALICE]));
    assert.deepEqual((await db.query(`select actor_id,event_key,context_type,context_id
      from pico_private.product_events where event_type='social_activated' order by actor_id`)).rows,
    [ALICE, BOB].sort().map(actor_id => ({ actor_id, event_key: 'first', context_type: null, context_id: null })));
    await asUser(db, BOB, async () => {
      await db.query('delete from public.connections where followed_id=$1', [ALICE]);
      await db.query('insert into public.connections(followed_id) values($1)', [ALICE]);
    });
    assert.equal((await db.query(`select count(*)::int count from pico_private.product_events
      where event_type='social_activated'`)).rows[0].count, 2);

    const stored = (await db.query(`select event_type,context_type,context_id,event_key,
      to_char(occurred_at at time zone 'America/Sao_Paulo','YYYY-MM-DD') occurred_day
      from pico_private.product_events order by event_type`)).rows;
    assert.equal(stored.length, 5);
    assert.ok(stored.every(event => event.context_id === null));
    const discovery = stored.find(event => event.event_type === 'discovery_opened');
    assert.match(discovery.event_key, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(discovery.event_key, discovery.occurred_day);
    assert.match(stored.find(event => event.event_type === 'share_prepared').event_key, /^profile:\d{4}-\d{2}-\d{2}$/);
    assert.doesNotMatch(JSON.stringify(stored), new RegExp(BOB, 'i'));

    const exported = await asService(db, async () => (await db.query(
      'select public.export_product_measurement($1) data', [ALICE],
    )).rows[0].data);
    assert.equal(Object.hasOwn(exported, 'profile_completed_at'), false);
    assert.equal(exported.product_measurement.length, 4);
    for (const item of exported.product_measurement) {
      assert.deepEqual(Object.keys(item).sort(), ['context_id', 'context_type', 'event_type', 'occurred_at']);
    }
    assert.ok(exported.product_measurement.some(item => item.event_type === 'profile_completed'));

    await asService(db, async () => {
      const core = (await db.query('select public.export_account_data_core($1) data', [ALICE])).rows[0].data;
      const canonical = (await db.query('select public.export_account_data($1) data', [ALICE])).rows[0].data;
      assert.equal(Object.hasOwn(core, 'product_measurement'), false);
      assert.equal(Object.hasOwn(core, 'profile_completed_at'), false);
      assert.deepEqual(canonical.product_measurement, exported.product_measurement);
      assert.equal(Object.hasOwn(canonical, 'profile_completed_at'), false);
    });

    await db.query(`insert into pico_private.product_measurement_exclusions(player_id,reason) values($1,'test')`, [BOB]);
    assert.equal(await asService(db, () => recordEvent(db, BOB, 'return_active')), false);
    await asUser(db, ALICE, () => assert.rejects(
      recordEvent(db, ALICE, 'return_active'),
      error => error.code === '42501',
    ));

    const signature = (await db.query(`select pg_get_function_arguments(p.oid) arguments
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='record_product_event'`)).rows[0].arguments;
    assert.doesNotMatch(signature, /event_key/i);
  } finally { await db.close(); }
});

test('scope invitations bind recipients, revalidate first use, hide email and retry acceptance idempotently', async () => {
  const db = await createTestDatabase();
  try {
    await enableMeasurement(db);
    await createOwnedCommunity(db);
    const bobUsername = (await db.query('select username from public.profiles where id=$1', [BOB])).rows[0].username;
    let communityInvite = await asUser(db, ALICE, async () => (await db.query(
      'select public.invite_community_player($1,$2) data', [COMMUNITY, bobUsername],
    )).rows[0].data);
    const replacedCommunityInvite = communityInvite;
    communityInvite = await asUser(db, ALICE, async () => (await db.query(
      'select public.invite_community_player($1,$2) data', [COMMUNITY, bobUsername],
    )).rows[0].data);
    assert.deepEqual((await db.query(`select email,recipient_id from pico_private.invitations where id=$1`,
      [communityInvite.id])).rows[0], { email: null, recipient_id: BOB });
    assert.ok((await db.query('select revoked_at from pico_private.invitations where id=$1',
      [replacedCommunityInvite.id])).rows[0].revoked_at);
    await asUser(db, BOB, () => assert.rejects(
      db.query(`select public.preview_scope_invitation('community',$1)`, [replacedCommunityInvite.token]),
      error => error.code === '42501',
    ));

    const legacyToken = 'b'.repeat(64);
    const legacy = (await db.query(`insert into pico_private.invitations(
      kind,scope_id,email,role,token_hash,created_by,expires_at)
      values('community',$1,'legacy@example.invalid','member',encode(sha256(convert_to($2,'UTF8')),'hex'),$3,now()-interval '1 minute')
      returning id`, [COMMUNITY, legacyToken, ALICE])).rows[0].id;
    await asUser(db, ALICE, async () => {
      const listed = (await db.query('select public.community_invitations($1) data', [COMMUNITY])).rows[0].data;
      assert.deepEqual(listed.find(item => item.id === communityInvite.id).recipient, `@${bobUsername}`);
      assert.equal(listed.find(item => item.id === legacy).recipient, 'convite legado');
      assert.equal(listed.find(item => item.id === communityInvite.id).expired, false);
      assert.equal(listed.find(item => item.id === legacy).expired, true);
      assert.ok(listed.every(item => !Object.hasOwn(item, 'email')));
      await db.query('select public.community_invitations($1,$2)', [COMMUNITY, legacy]);
      await assert.rejects(
        db.query('select public.community_invitations($1,$2)', [COMMUNITY, legacy]),
        error => error.code === '42501',
      );
    });
    assert.ok((await db.query('select revoked_at from pico_private.invitations where id=$1', [legacy])).rows[0].revoked_at);

    await asUser(db, ALICE, () => assert.rejects(
      db.query(`select public.preview_scope_invitation('community',$1)`, [communityInvite.token]),
      error => error.code === '42501',
    ));
    await db.query(`update public.communities set status='archived' where id=$1`, [COMMUNITY]);
    await asUser(db, BOB, () => assert.rejects(
      db.query(`select public.preview_scope_invitation('community',$1)`, [communityInvite.token]),
      error => error.code === '42501',
    ));
    await db.query(`update public.communities set status='active',owner_id=null where id=$1`, [COMMUNITY]);
    await asUser(db, BOB, () => assert.rejects(
      db.query(`select public.preview_scope_invitation('community',$1)`, [communityInvite.token]),
      error => error.code === '42501',
    ));
    await db.query('update public.communities set owner_id=$2 where id=$1', [COMMUNITY, ALICE]);
    await db.query(`insert into public.community_members(community_id,player_id,status)
      values($1,$2,'suspended')`, [COMMUNITY, BOB]);
    await asUser(db, BOB, () => assert.rejects(
      db.query(`select public.preview_scope_invitation('community',$1)`, [communityInvite.token]),
      error => error.code === '42501',
    ));
    await db.query('delete from public.community_members where community_id=$1 and player_id=$2', [COMMUNITY, BOB]);

    await db.query(`update pico_private.beta_admissions set status='suspended' where player_id=$1`, [BOB]);
    await asUser(db, BOB, () => assert.rejects(
      db.query('select public.accept_community_player_invite($1)', [communityInvite.token]),
      error => error.code === '42501',
    ));
    await db.query(`update pico_private.beta_admissions set status='approved' where player_id=$1`, [BOB]);

    const previewed = await asUser(db, BOB, async () => (await db.query(
      `select public.preview_scope_invitation('community',$1) id`, [communityInvite.token],
    )).rows[0].id);
    assert.equal(previewed, communityInvite.id);
    assert.equal(await asService(db, () => recordEvent(
      db, BOB, 'invitation_opened', 'invitation', communityInvite.id,
    )), true);

    assert.equal(await asUser(db, BOB, async () => (await db.query(
      'select public.accept_community_player_invite($1) id', [communityInvite.token],
    )).rows[0].id), COMMUNITY);
    await asUser(db, ALICE, () => assert.rejects(
      db.query('select public.invite_community_player($1,$2)', [COMMUNITY, bobUsername]),
      error => error.code === '42501',
    ));
    await db.query(`update public.community_members set status='removed'
      where community_id=$1 and player_id=$2`, [COMMUNITY, BOB]);
    await db.query(`update public.communities set status='archived',owner_id=null where id=$1`, [COMMUNITY]);
    assert.equal(await asUser(db, BOB, async () => (await db.query(
      'select public.accept_community_player_invite($1) id', [communityInvite.token],
    )).rows[0].id), COMMUNITY);
    assert.equal((await db.query(`select status from public.community_members
      where community_id=$1 and player_id=$2`, [COMMUNITY, BOB])).rows[0].status, 'removed');
    await asUser(db, ALICE, () => assert.rejects(
      db.query('select public.accept_community_player_invite($1)', [communityInvite.token]),
      error => error.code === '42501',
    ));
    await db.query('update pico_private.invitations set revoked_at=now() where id=$1', [communityInvite.id]);
    await asUser(db, BOB, () => assert.rejects(
      db.query('select public.accept_community_player_invite($1)', [communityInvite.token]),
      error => error.code === '42501',
    ));

    await db.query(`update public.arenas set owner_id=$2,status='active' where id=$1`, [VILA, ALICE]);
    let arenaInvite = await asUser(db, ALICE, async () => (await db.query(
      `select public.invite_arena_player($1,$2,'moderator') data`, [VILA, bobUsername],
    )).rows[0].data);
    const replacedArenaInvite = arenaInvite;
    arenaInvite = await asUser(db, ALICE, async () => (await db.query(
      `select public.invite_arena_player($1,$2,'moderator') data`, [VILA, bobUsername],
    )).rows[0].data);
    assert.ok((await db.query('select revoked_at from pico_private.invitations where id=$1',
      [replacedArenaInvite.id])).rows[0].revoked_at);
    await asUser(db, ALICE, async () => {
      const listed = (await db.query('select public.arena_invitations($1) data', [VILA])).rows[0].data;
      const row = listed.find(item => item.id === arenaInvite.id);
      assert.deepEqual({ recipient: row.recipient, role: row.role, expired: row.expired },
        { recipient: `@${bobUsername}`, role: 'moderator', expired: false });
      assert.equal(Object.hasOwn(row, 'email'), false);
    });
    const revokeAuditsBefore = (await db.query(`select count(*)::int count from pico_private.audit_events
      where action='arena.invite.revoke'`)).rows[0].count;
    await asUser(db, ALICE, () => assert.rejects(
      db.query('select public.revoke_arena_invite($1)', [replacedArenaInvite.id]),
      error => error.code === '42501',
    ));
    assert.equal((await db.query(`select count(*)::int count from pico_private.audit_events
      where action='arena.invite.revoke'`)).rows[0].count, revokeAuditsBefore);
    assert.equal(await asUser(db, BOB, async () => (await db.query(
      'select public.accept_arena_player_invite($1) id', [arenaInvite.token],
    )).rows[0].id), VILA);
    await asUser(db, ALICE, () => assert.rejects(
      db.query('select public.revoke_arena_invite($1)', [arenaInvite.id]),
      error => error.code === '42501',
    ));
    assert.equal((await db.query(`select count(*)::int count from pico_private.audit_events
      where action='arena.invite.revoke'`)).rows[0].count, revokeAuditsBefore);
    await db.query('delete from public.arena_staff where arena_id=$1 and player_id=$2', [VILA, BOB]);
    await db.query('delete from public.arena_members where arena_id=$1 and player_id=$2', [VILA, BOB]);
    await db.query(`update public.arenas set owner_id=null,status='archived' where id=$1`, [VILA]);
    assert.equal(await asUser(db, BOB, async () => (await db.query(
      'select public.accept_arena_player_invite($1) id', [arenaInvite.token],
    )).rows[0].id), VILA);
    assert.equal((await db.query(`select count(*)::int count from public.arena_staff
      where arena_id=$1 and player_id=$2`, [VILA, BOB])).rows[0].count, 0);

    const grants = (await db.query(`select
      has_function_privilege('authenticated','public.invite_community_member(uuid,text)','execute') legacy_issue,
      has_function_privilege('authenticated','public.revoke_arena_invite(uuid)','execute') arena_revoke,
      has_function_privilege('authenticated','public.community_invitations(uuid,uuid)','execute') community_revoke`)).rows[0];
    assert.deepEqual(grants, { legacy_issue: false, arena_revoke: true, community_revoke: true });
  } finally { await db.close(); }
});

test('an authorized platform moderator can issue and redeem an official-community invitation', async () => {
  const db = await createTestDatabase();
  try {
    const officialCommunity = (await db.query(
      'select community_id from pico_private.pico_community limit 1',
    )).rows[0].community_id;
    await db.query(`insert into pico_private.platform_grants(player_id,role) values($1,'moderator')
      on conflict(player_id) do update set role='moderator'`, [ALICE]);
    await db.query(`insert into auth.users(id,email) values($1,'charlie@example.invalid')`, [CHARLIE]);
    await db.query(`update pico_private.beta_admissions set status='approved' where player_id=$1`, [CHARLIE]);
    const username = (await db.query('select username from public.profiles where id=$1', [CHARLIE])).rows[0].username;

    const invite = await asUser(db, ALICE, async () => (await db.query(
      'select public.invite_community_player($1,$2) data', [officialCommunity, username],
    )).rows[0].data);
    assert.equal(await asUser(db, CHARLIE, async () => (await db.query(
      `select public.preview_scope_invitation('community',$1) id`, [invite.token],
    )).rows[0].id), invite.id);
    assert.equal(await asUser(db, CHARLIE, async () => (await db.query(
      'select public.accept_community_player_invite($1) id', [invite.token],
    )).rows[0].id), officialCommunity);
  } finally { await db.close(); }
});

test('bilateral blocks prevent new scope invitations', async () => {
  const db = await createTestDatabase();
  try {
    await createOwnedCommunity(db);
    await db.query(`update public.arenas set owner_id=$2,status='active' where id=$1`, [VILA, ALICE]);
    const bobUsername = (await db.query('select username from public.profiles where id=$1', [BOB])).rows[0].username;
    await asUser(db, BOB, () => db.query('insert into public.blocks(blocked_id) values($1)', [ALICE]));

    const outcomes = {
      community: await resultOrErrorCode(() => asUser(db, ALICE, () => db.query(
        'select public.invite_community_player($1,$2)', [COMMUNITY, bobUsername],
      ))),
      arena: await resultOrErrorCode(() => asUser(db, ALICE, () => db.query(
        `select public.invite_arena_player($1,$2,'moderator')`, [VILA, bobUsername],
      ))),
    };
    assert.deepEqual(outcomes, { community: '42501', arena: '42501' });
    assert.equal((await db.query(`select count(*)::int count from pico_private.invitations
      where recipient_id=$1 and kind in ('arena','community')`, [BOB])).rows[0].count, 0);
  } finally { await db.close(); }
});

test('bilateral blocks invalidate existing scope invitations and neutralize manager lists', async () => {
  const db = await createTestDatabase();
  try {
    await createOwnedCommunity(db);
    await db.query(`update public.arenas set owner_id=$2,status='active' where id=$1`, [VILA, ALICE]);
    const bobUsername = (await db.query('select username from public.profiles where id=$1', [BOB])).rows[0].username;
    const communityInvite = await asUser(db, ALICE, async () => (await db.query(
      'select public.invite_community_player($1,$2) data', [COMMUNITY, bobUsername],
    )).rows[0].data);
    const arenaInvite = await asUser(db, ALICE, async () => (await db.query(
      `select public.invite_arena_player($1,$2,'moderator') data`, [VILA, bobUsername],
    )).rows[0].data);
    await asUser(db, BOB, () => db.query('insert into public.blocks(blocked_id) values($1)', [ALICE]));

    const listed = await asUser(db, ALICE, async () => ({
      community: (await db.query('select public.community_invitations($1) data', [COMMUNITY])).rows[0].data,
      arena: (await db.query('select public.arena_invitations($1) data', [VILA])).rows[0].data,
    }));
    assert.equal(listed.community.find(item => item.id === communityInvite.id).recipient, 'conta indisponível');
    assert.equal(listed.arena.find(item => item.id === arenaInvite.id).recipient, 'conta indisponível');

    const outcomes = {
      communityPreview: await resultOrErrorCode(() => asUser(db, BOB, () => db.query(
        `select public.preview_scope_invitation('community',$1)`, [communityInvite.token],
      ))),
      arenaPreview: await resultOrErrorCode(() => asUser(db, BOB, () => db.query(
        `select public.preview_scope_invitation('arena',$1)`, [arenaInvite.token],
      ))),
      communityAccept: await resultOrErrorCode(() => asUser(db, BOB, () => db.query(
        'select public.accept_community_player_invite($1)', [communityInvite.token],
      ))),
      arenaAccept: await resultOrErrorCode(() => asUser(db, BOB, () => db.query(
        'select public.accept_arena_player_invite($1)', [arenaInvite.token],
      ))),
    };
    assert.deepEqual(outcomes, {
      communityPreview: '42501', arenaPreview: '42501', communityAccept: '42501', arenaAccept: '42501',
    });
    assert.equal((await db.query(`select count(*)::int count from public.community_members
      where community_id=$1 and player_id=$2`, [COMMUNITY, BOB])).rows[0].count, 0);
    assert.equal((await db.query(`select count(*)::int count from public.arena_staff
      where arena_id=$1 and player_id=$2`, [VILA, BOB])).rows[0].count, 0);
  } finally { await db.close(); }
});

test('arena rank 30 cannot replace an owner-only admin invitation', async () => {
  const db = await createTestDatabase();
  try {
    await db.query(`update public.arenas set owner_id=$2,status='active' where id=$1`, [VILA, ALICE]);
    await db.query(`insert into auth.users(id,email) values($1,'charlie@example.invalid')`, [CHARLIE]);
    await db.query(`insert into pico_private.beta_admissions(player_id,status) values($1,'approved')
      on conflict(player_id) do update set status='approved'`, [CHARLIE]);
    await db.query(`insert into public.arena_staff(arena_id,player_id,role) values($1,$2,'admin')`, [VILA, CHARLIE]);
    const bobUsername = (await db.query('select username from public.profiles where id=$1', [BOB])).rows[0].username;
    const adminInvite = await asUser(db, ALICE, async () => (await db.query(
      `select public.invite_arena_player($1,$2,'admin') data`, [VILA, bobUsername],
    )).rows[0].data);

    assert.equal(await resultOrErrorCode(() => asUser(db, CHARLIE, () => db.query(
      'select public.revoke_arena_invite($1)', [adminInvite.id],
    ))), '42501');
    assert.equal(await resultOrErrorCode(() => asUser(db, CHARLIE, () => db.query(
      `select public.invite_arena_player($1,$2,'moderator')`, [VILA, bobUsername],
    ))), '42501');
    assert.equal((await db.query('select revoked_at from pico_private.invitations where id=$1',
      [adminInvite.id])).rows[0].revoked_at, null);
    assert.equal((await db.query(`select count(*)::int count from pico_private.invitations
      where kind='arena' and scope_id=$1 and recipient_id=$2 and accepted_at is null and revoked_at is null`,
    [VILA, BOB])).rows[0].count, 1);
  } finally { await db.close(); }
});

test('scope invitation issue rejects suspended recipients and an arena owner', async () => {
  const db = await createTestDatabase();
  try {
    await createOwnedCommunity(db);
    await db.query(`update public.arenas set owner_id=$2,status='active' where id=$1`, [VILA, ALICE]);
    await db.query(`insert into public.community_members(community_id,player_id,status)
      values($1,$2,'suspended')`, [COMMUNITY, BOB]);
    await db.query(`insert into public.arena_members(arena_id,player_id,status)
      values($1,$2,'suspended') on conflict(arena_id,player_id) do update set status='suspended'`, [VILA, BOB]);
    await db.query(`insert into auth.users(id,email) values($1,'charlie@example.invalid')`, [CHARLIE]);
    await db.query(`insert into pico_private.beta_admissions(player_id,status) values($1,'approved')
      on conflict(player_id) do update set status='approved'`, [CHARLIE]);
    await db.query(`insert into public.arena_staff(arena_id,player_id,role) values($1,$2,'admin')`, [VILA, CHARLIE]);
    const usernames = Object.fromEntries((await db.query(`select id,username from public.profiles
      where id in ($1,$2)`, [ALICE, BOB])).rows.map(row => [row.id, row.username]));

    const outcomes = {
      communitySuspended: await resultOrErrorCode(() => asUser(db, ALICE, () => db.query(
        'select public.invite_community_player($1,$2)', [COMMUNITY, usernames[BOB]],
      ))),
      arenaSuspended: await resultOrErrorCode(() => asUser(db, ALICE, () => db.query(
        `select public.invite_arena_player($1,$2,'moderator')`, [VILA, usernames[BOB]],
      ))),
      arenaOwner: await resultOrErrorCode(() => asUser(db, CHARLIE, () => db.query(
        `select public.invite_arena_player($1,$2,'moderator')`, [VILA, usernames[ALICE]],
      ))),
    };
    assert.deepEqual(outcomes, {
      communitySuspended: '42501', arenaSuspended: '42501', arenaOwner: '42501',
    });
    assert.equal((await db.query(`select count(*)::int count from pico_private.invitations
      where kind in ('arena','community') and recipient_id in ($1,$2)`, [ALICE, BOB])).rows[0].count, 0);
  } finally { await db.close(); }
});

test('manager invitation lists are capped at one hundred newest rows', async () => {
  const db = await createTestDatabase();
  try {
    await createOwnedCommunity(db);
    await db.query(`update public.arenas set owner_id=$2,status='active' where id=$1`, [VILA, ALICE]);
    await db.query(`insert into pico_private.invitations(
      kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id,created_at)
      select 'community',$1,null,'member','list-community-'||n,$2,now()+interval '7 days',$3,
        now()-n*interval '1 second' from generate_series(1,101) n`, [COMMUNITY, ALICE, BOB]);
    await db.query(`insert into pico_private.invitations(
      kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id,created_at)
      select 'arena',$1,null,'moderator','list-arena-'||n,$2,now()+interval '7 days',$3,
        now()-n*interval '1 second' from generate_series(1,101) n`, [VILA, ALICE, BOB]);

    const listed = await asUser(db, ALICE, async () => ({
      community: (await db.query('select public.community_invitations($1) data', [COMMUNITY])).rows[0].data,
      arena: (await db.query('select public.arena_invitations($1) data', [VILA])).rows[0].data,
    }));
    assert.equal(listed.community.length, 100);
    assert.equal(listed.arena.length, 100);
  } finally { await db.close(); }
});

test('account export includes only sanitized invitations issued or received by the subject', async () => {
  const db = await createTestDatabase();
  try {
    await createOwnedCommunity(db);
    await db.query(`insert into auth.users(id,email) values($1,'charlie@example.invalid')`, [CHARLIE]);
    await db.query(`insert into pico_private.beta_admissions(player_id,status) values($1,'approved')
      on conflict(player_id) do update set status='approved'`, [CHARLIE]);
    await db.query(`insert into pico_private.invitations(
      id,kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id)
      values
        ($1,'community',$4,'bob-private@example.invalid','member','export-issued-secret',$5,now()+interval '7 days',$6),
        ($2,'arena',$7,'alice-private@example.invalid','moderator','export-received-secret',$6,now()+interval '7 days',$5),
        ($3,'community',$4,'charlie-private@example.invalid','member','export-unrelated-secret',$6,now()+interval '7 days',$8)`,
    [...EXPORT_INVITES, COMMUNITY, ALICE, BOB, VILA, CHARLIE]);

    const exported = await asService(db, async () => (await db.query(
      'select public.export_account_data($1) data', [ALICE],
    )).rows[0].data);
    assert.equal(exported.scope_invitations.length, 2);
    const invitations = [...exported.scope_invitations].sort((a, b) => a.direction.localeCompare(b.direction));
    assert.deepEqual(invitations.map(item => item.direction), ['issued', 'received']);
    for (const item of invitations) {
      assert.deepEqual(Object.keys(item).sort(), [
        'accepted_at', 'created_at', 'direction', 'expires_at', 'id', 'kind', 'revoked_at', 'role', 'scope_id',
      ]);
    }
    assert.doesNotMatch(JSON.stringify(exported.scope_invitations),
      /token_hash|created_by|recipient_id|accepted_by|private@example\.invalid|export-(?:issued|received|unrelated)-secret/i);
  } finally { await db.close(); }
});

test('reports expose only complete retained days and suppress 1-4 cells with complements independently', async () => {
  const db = await createTestDatabase();
  try {
    await enableMeasurement(db);
    await createOwnedCommunity(db);
    const { report_day: reportDay, today } = await localDates(db);
    const outside = await snapshot(db, today);
    assert.deepEqual({ status: outside.status, reason: outside.reason, hasBase: outside.hasBase },
      { status: 'incomplete', reason: 'outside_complete_retained_window', hasBase: false });
    assert.equal(outside.availableStart, reportDay);
    assert.equal(outside.availableEnd, reportDay);

    for (const [index, id] of METRIC_INVITES.entries()) {
      await db.query(`insert into pico_private.invitations(
        id,kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id,created_at)
        values($1,'community',$2,null,'member',$3,$4,
          ($5::date+time '12:00') at time zone 'America/Sao_Paulo'+interval '7 days',$6,
          ($5::date+time '12:00') at time zone 'America/Sao_Paulo')`,
      [id, COMMUNITY, `metric-token-${index}`, ALICE, reportDay, BOB]);
    }

    let report = await snapshot(db, reportDay);
    assert.equal(report.status, 'ready');
    assert.equal(report.smallCellMinimum, 5);
    assert.deepEqual(
      { issued: report.invitations.issued, opened: report.invitations.opened,
        accepted: report.invitations.accepted, suppressed: report.invitations.suppressed },
      { issued: 5, opened: 0, accepted: 0, suppressed: false },
    );

    async function addOpen(id, when = reportDay) {
      await db.query(`insert into pico_private.product_events(
        actor_id,event_type,context_type,context_id,event_key,occurred_at)
        values($1,'invitation_opened','invitation',$2::uuid,$2::uuid::text,
          ($3::date+time '13:00') at time zone 'America/Sao_Paulo')`, [BOB, id, when]);
    }
    await addOpen(METRIC_INVITES[0]);
    report = await snapshot(db, reportDay);
    assert.deepEqual(
      { issued: report.invitations.issued, opened: report.invitations.opened,
        accepted: report.invitations.accepted, suppressed: report.invitations.suppressed },
      { issued: 5, opened: null, accepted: 0, suppressed: true },
    );

    for (const id of METRIC_INVITES.slice(1, 4)) await addOpen(id);
    report = await snapshot(db, reportDay);
    assert.equal(report.invitations.issued, 5);
    assert.equal(report.invitations.opened, null);
    assert.equal(report.invitations.suppressed, true);

    await addOpen(METRIC_INVITES[4], today);
    report = await snapshot(db, reportDay);
    assert.equal(report.invitations.opened, null);
    await db.query(`update pico_private.product_events set occurred_at=
      ($2::date+time '13:00') at time zone 'America/Sao_Paulo' where context_id=$1`,
    [METRIC_INVITES[4], reportDay]);
    report = await snapshot(db, reportDay);
    assert.deepEqual(
      { issued: report.invitations.issued, opened: report.invitations.opened,
        accepted: report.invitations.accepted, suppressed: report.invitations.suppressed },
      { issued: 5, opened: 5, accepted: 0, suppressed: false },
    );

    await db.query(`update pico_private.invitations set accepted_by=$2,
      accepted_at=($3::date+time '13:30') at time zone 'America/Sao_Paulo' where id=$1`,
    [METRIC_INVITES[0], BOB, today]);
    report = await snapshot(db, reportDay);
    assert.equal(report.invitations.accepted, 0);

    const alicePost = (await db.query(
      `insert into public.posts(author_id,body,distribution_explicit) values($1,'Relato da Alice',true) returning id`, [ALICE],
    )).rows[0].id;
    const bobPost = (await db.query(
      `insert into public.posts(author_id,body,distribution_explicit) values($1,'Relato do Bob',true) returning id`, [BOB],
    )).rows[0].id;
    const bobComment = (await db.query(
      `insert into public.comments(post_id,author_id,body) values($1,$2,'Resposta do Bob') returning id`, [alicePost, BOB],
    )).rows[0].id;
    await db.query(`insert into public.comments(post_id,author_id,body)
      values($1,$2,'Resposta da Alice')`, [bobPost, ALICE]);
    await db.query(`update public.comments set created_at=
      ($1::date+time '15:00') at time zone 'America/Sao_Paulo' where post_id in ($2,$3)`,
    [reportDay, alicePost, bobPost]);
    report = await snapshot(db, reportDay);
    assert.deepEqual({ hasBase: report.weeklyReciprocalPeople.hasBase, suppressed: report.weeklyReciprocalPeople.suppressed },
      { hasBase: true, suppressed: true });
    await db.query('update public.comments set moderated_at=now() where id=$1', [bobComment]);
    report = await snapshot(db, reportDay);
    assert.deepEqual({ hasBase: report.weeklyReciprocalPeople.hasBase, suppressed: report.weeklyReciprocalPeople.suppressed },
      { hasBase: false, suppressed: false });
  } finally { await db.close(); }
});

test('D7 profile, social and invitation cohorts use equal mature windows and stop on collection gaps', async () => {
  const db = await createTestDatabase();
  try {
    await enableMeasurement(db, { startedDays: 12 });
    await createOwnedCommunity(db);
    const { report_day: reportDay } = await localDates(db);
    const cohortDay = (await db.query(`select to_char($1::date-7,'YYYY-MM-DD') value`, [reportDay])).rows[0].value;

    for (const [index, id] of METRIC_USERS.entries()) {
      await db.query(`insert into auth.users(id,email) values($1,$2)`, [id, `metric-${index}@example.invalid`]);
      await db.query(`insert into pico_private.beta_admissions(player_id,status) values($1,'approved')
        on conflict(player_id) do update set status='approved'`, [id]);
      await db.query(`update public.profiles set created_at=
        ($2::date+time '12:00') at time zone 'America/Sao_Paulo' where id=$1`, [id, cohortDay]);
      await db.query(`insert into pico_private.product_events(
        actor_id,event_type,event_key,occurred_at) values
        ($1,'profile_completed','first',($2::date+time '13:00') at time zone 'America/Sao_Paulo'+interval '1 day'),
        ($1,'social_activated','first',($2::date+time '14:00') at time zone 'America/Sao_Paulo'+interval '2 days')`,
      [id, cohortDay]);
      await db.query(`insert into pico_private.invitations(
        id,kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id,created_at,accepted_at,accepted_by)
        values($1,'community',$2,null,'member',$3,$4,
          ($5::date+time '12:00') at time zone 'America/Sao_Paulo'+interval '7 days',$6,
          ($5::date+time '12:00') at time zone 'America/Sao_Paulo',
          ($5::date+time '13:30') at time zone 'America/Sao_Paulo',$6)`,
      [METRIC_INVITES[index], COMMUNITY, `d7-token-${index}`, ALICE, cohortDay, id]);
    }

    let report = await snapshot(db, cohortDay, reportDay);
    assert.equal(report.status, 'ready');
    assert.deepEqual(report.profileCompletionD7ByCohort, [{
      cohortDay, eligible: 5, activated: 5, hasBase: true, suppressed: false,
    }]);
    assert.deepEqual(report.socialActivationD7ByCohort, [{
      cohortDay, eligible: 5, activated: 5, hasBase: true, suppressed: false,
    }]);
    assert.deepEqual({
      issued: report.invitations.issued,
      accepted: report.invitations.accepted,
      matureAccepted: report.invitations.matureAccepted,
      socialActivatedD7: report.invitations.socialActivatedD7,
      suppressed: report.invitations.suppressed,
    }, { issued: 5, accepted: 5, matureAccepted: 5, socialActivatedD7: 5, suppressed: false });

    await db.query(`delete from pico_private.product_events
      where actor_id=$1 and event_type='social_activated'`, [METRIC_USERS[0]]);
    report = await snapshot(db, cohortDay, reportDay);
    assert.deepEqual(report.socialActivationD7ByCohort, [{
      cohortDay, eligible: null, activated: null, hasBase: true, suppressed: true,
    }]);
    assert.deepEqual({
      matureAccepted: report.invitations.matureAccepted,
      socialActivatedD7: report.invitations.socialActivatedD7,
      suppressed: report.invitations.suppressed,
    }, { matureAccepted: 5, socialActivatedD7: null, suppressed: true });

    await db.query(`insert into pico_private.product_measurement_gaps(started_at,ended_at,reason)
      values(($1::date+time '10:00') at time zone 'America/Sao_Paulo',
        ($1::date+time '11:00') at time zone 'America/Sao_Paulo','retention_heartbeat')`, [cohortDay]);
    report = await snapshot(db, cohortDay, reportDay);
    assert.deepEqual({ status: report.status, reason: report.reason, hasBase: report.hasBase },
      { status: 'incomplete', reason: 'collection_gap', hasBase: false });
  } finally { await db.close(); }
});

test('request-edge RPC retries transport failures and verifies the persisted failure marker', async () => {
  let records = 0;
  let markers = 0;
  let outcome = await executeMeasurementWrite(
    async () => { records += 1; return { error: { code: '42501' }, status: 403 }; },
    async () => { markers += 1; return { error: { code: 'PGRST202' }, status: 404 }; },
  );
  assert.deepEqual(outcome, { recorded: false, operationalFailure: true, markerFailed: true });
  assert.deepEqual({ records, markers }, { records: 1, markers: 1 });

  records = 0;
  markers = 0;
  outcome = await executeMeasurementWrite(
    async () => { records += 1; return { error: { code: '23514' }, status: 400 }; },
    async () => { markers += 1; return { error: null, status: 204 }; },
  );
  assert.deepEqual(outcome, { recorded: false, operationalFailure: false, markerFailed: false });
  assert.deepEqual({ records, markers }, { records: 1, markers: 0 });

  records = 0;
  outcome = await executeMeasurementWrite(
    async () => {
      records += 1;
      return records === 1 ? { error: { code: 'transport' }, status: 503 } : { data: true, error: null, status: 200 };
    },
    async () => ({ error: null, status: 204 }),
  );
  assert.deepEqual(outcome, { recorded: true, operationalFailure: false, markerFailed: false });
  assert.equal(records, 2);
});

test('measurement SQL and helper expose no generic metadata or caller-provided event key', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260927130000_product_measurement.sql', import.meta.url), 'utf8');
  const helper = await readFile(new URL('../src/lib/product-measurement.ts', import.meta.url), 'utf8');
  const rpcHelper = await readFile(new URL('../src/lib/product-measurement-rpc.ts', import.meta.url), 'utf8');
  const features = await readFile(new URL('../src/lib/features.ts', import.meta.url), 'utf8');
  const metricsScript = await readFile(new URL('../scripts/product-metrics.mjs', import.meta.url), 'utf8');
  const heartbeatScript = await readFile(new URL('../scripts/product-measurement-heartbeat.mjs', import.meta.url), 'utf8');
  const heartbeatRoute = await readFile(new URL('../src/app/api/internal/product-measurement-heartbeat/route.ts', import.meta.url), 'utf8');
  const eventTable = migration.slice(
    migration.indexOf('create table pico_private.product_events'),
    migration.indexOf('create index product_events_period'),
  );
  const eventRpcStart = migration.indexOf('create function public.record_product_event');
  const eventRpc = migration.slice(eventRpcStart,
    migration.indexOf('create function pico_private.available_scope_invitation', eventRpcStart));
  const socialActivationStart = migration.indexOf('create function pico_private.record_social_activation');
  const socialActivation = migration.slice(socialActivationStart,
    migration.indexOf('revoke all on function pico_private.record_social_activation', socialActivationStart));
  const socialPairLock = socialActivation.indexOf('pg_advisory_xact_lock');
  const socialEventTime = socialActivation.search(/event_time\s*:=\s*clock_timestamp\(\)/);
  const socialInsert = socialActivation.indexOf('insert into pico_private.product_events');
  assert.doesNotMatch(eventTable, /properties\s+json|payload\s+json|user_agent|ip_address|email\s+text|url\s+text|message_body|post_body/i);
  assert.match(eventTable, /context_id uuid references pico_private\.invitations\(id\) on delete cascade/);
  assert.doesNotMatch(eventRpc, /p_event_key/i);
  assert.doesNotMatch(migration, /add column onboarding_completed_at|activation_eligible/i);
  assert.match(migration, /create table pico_private\.product_measurement_gaps/);
  assert.match(migration, /'status','incomplete','reason','collection_gap'/);
  assert.match(migration, /'status','incomplete','reason','request_edge_gap'/);
  assert.match(migration, /where singleton for share[\s\S]*product_measurement_edge_state[\s\S]*where singleton for share/);
  assert.match(migration, /release=setting\.expected_edge_release/);
  assert.match(migration, /values\(new\.collection_started_at,now_at,'database','disabled'\)/);
  assert.match(migration, /pg_advisory_xact_lock[\s\S]*exists\(select 1 from public\.connections/);
  assert.ok(socialPairLock >= 0 && socialEventTime > socialPairLock && socialEventTime < socialInsert,
    'social activation must timestamp the observation after waiting for the pair lock');
  assert.match(migration, /perform 1 from public\.arenas where id=invite\.scope_id for update[\s\S]*scope_invitation_available/);
  assert.match(migration, /perform 1 from public\.communities where id=invite\.scope_id for update[\s\S]*scope_invitation_available/);
  assert.match(migration, /perform 1 from pico_private\.platform_grants[\s\S]*community_members[\s\S]*scope_invitation_available/);
  assert.match(migration, /c\.moderated_at is null and p\.moderated_at is null/);
  assert.match(migration, /alter function public\.export_account_data\(uuid\) rename to export_account_data_core/);
  assert.match(features, /PICO_PRODUCT_MEASUREMENT_ENABLED/);
  assert.match(metricsScript, /assertRemoteIdentity\(process\.env, 'metrics'\)/);
  assert.match(heartbeatScript, /api\/internal\/product-measurement-heartbeat/);
  assert.doesNotMatch(heartbeatScript, /SUPABASE_SECRET_KEY|\.rpc\(/);
  assert.match(heartbeatRoute, /timingSafeEqual/);
  assert.match(heartbeatRoute, /p_release:\s*release/);
  assert.match(heartbeatRoute, /result\.data\s*!==\s*true/);
  assert.doesNotMatch(rpcHelper, /code\s*===\s*['"]42501/);
  assert.match(rpcHelper, /Boolean\(marker\.error\)/);
  assert.match(helper, /after\(\(\)\s*=>\s*writeProductEvent\(event\)\)/);
  assert.match(helper, /abortSignal\(AbortSignal\.timeout/);
  assert.doesNotMatch(helper, /reportDisabledEdge/);
  assert.doesNotMatch(helper, /console\.(?:warn|error)\([^\n]*(?:actorId|contextId|eventKey)/);
});

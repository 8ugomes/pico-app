import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI, BEACH, PRIVATE } from './helpers/database.mjs';
import { parseMutation } from '../src/lib/supabase/mutations.ts';
let db;
before(async () => { db = await createTestDatabase(); });
after(async () => { await db?.close(); });
const start = (arena = VILA, sport = FUTEVOLEI) => db.query('select public.start_checkin($1,$2) as id', [arena, sport]);
test('check-in accepts no client identity, duration or timestamps', () => {
  assert.deepEqual(parseMutation({ action: 'end_checkin' }), { action: 'end_checkin' });
  for (const extra of [{ player_id: BOB }, { expires_at: '2099-01-01' }, { duration: 500 }, { id: BOB }]) {
    assert.throws(() => parseMutation({ action: 'start_checkin', arenaId: VILA, sportId: FUTEVOLEI, ...extra }));
    assert.throws(() => parseMutation({ action: 'end_checkin', ...extra }));
  }
});
test('RPCs require authentication and enforce public arena + valid sport', async () => {
  await asUser(db, null, async () => {
    await assert.rejects(start(), e => e.code === '42501');
    await assert.rejects(db.query('select public.end_checkin()'), e => e.code === '42501');
  });
  await asUser(db, ALICE, async () => {
    await assert.rejects(start(PRIVATE), e => e.code === '23514');
    await assert.rejects(start(VILA, BEACH), e => e.code === '23514');
    await start();
    await assert.rejects(start(PRIVATE), e => e.code === '23514');
    const rows = (await db.query('select * from checkins')).rows;
    assert.equal(rows.length, 1); assert.equal(rows[0].player_id, ALICE);
    assert.equal(new Date(rows[0].expires_at) - new Date(rows[0].started_at), 7200000);
  });
});
test('start replaces previous presence atomically; end only affects caller and is idempotent', async () => {
  await asUser(db, BOB, async () => { await start(); });
  await asUser(db, ALICE, async () => { await start(); });
  assert.equal((await db.query('select * from checkins where player_id=$1', [ALICE])).rows.length, 2);
  assert.equal((await db.query('select * from checkins where player_id=$1 and ended_at is null', [ALICE])).rows.length, 1);
  await asUser(db, ALICE, async () => { await db.query('select public.end_checkin()'); await db.query('select public.end_checkin()'); });
  assert.equal((await db.query('select * from checkins where player_id=$1 and ended_at is null', [BOB])).rows.length, 1);
  assert.equal((await db.query('select * from checkins where player_id=$1 and ended_at is null', [ALICE])).rows.length, 0);
});
test('expired rows disappear through RLS and can be replaced', async () => {
  await db.query(`update checkins set started_at=now()-interval '3 hours', expires_at=now()-interval '1 hour' where player_id=$1 and ended_at is null`, [BOB]);
  await asUser(db, BOB, async () => { assert.equal((await db.query('select * from checkins')).rows.length, 0); await start(); });
  assert.equal((await db.query('select * from checkins where player_id=$1 and ended_at is null', [BOB])).rows.length, 1);
});

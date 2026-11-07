import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';

const today = async db => (await db.query("select (now() at time zone 'America/Sao_Paulo')::date::text d")).rows[0].d;
const shift = async (db, n) => (await db.query("select ((now() at time zone 'America/Sao_Paulo')::date + $1::int)::text d", [n])).rows[0].d;

test('arena check-ins are retrospective, bounded, idempotent and reversible', async () => {
  const db = await createTestDatabase();
  const arena = randomUUID();
  try {
    await db.query("insert into public.arenas(id,slug,name,city,neighborhood) values($1,'arena-checkin-teste','Arena check-in','São Paulo','Teste')", [arena]);
    await db.query('insert into public.arena_sports(arena_id,sport_id) values($1,$2)', [arena, FUTEVOLEI]);
    await db.query('update public.profiles set onboarding_completed = true where id in ($1,$2)', [ALICE, BOB]);
    await asUser(db, ALICE, async () => {
      await db.query('select public.record_arena_checkin($1)', [arena]);
      await db.query('select public.record_arena_checkin($1)', [arena]);
      await db.query('select public.record_arena_checkin($1,$2)', [arena, await shift(db, -6)]);
      await assert.rejects(db.query('select public.record_arena_checkin($1,$2)', [arena, await shift(db, 1)]), e => e.code === '23514');
      await assert.rejects(db.query('select public.record_arena_checkin($1,$2)', [arena, await shift(db, -7)]), e => e.code === '23514');
      await assert.rejects(db.query('select public.record_arena_checkin($1)', [VILA]), e => e.code === '23514');
      const all = (await db.query("select public.read_arena_ranking($1,'all') r", [arena])).rows[0].r;
      assert.equal(all.entries[0].days, 2);
      assert.equal(all.today_done, true);
      assert.equal(all.recent_days.length, 2);
      await db.query('select public.remove_arena_checkin($1,$2)', [arena, await today(db)]);
      assert.equal((await db.query("select public.read_arena_ranking($1,'all') r", [arena])).rows[0].r.today_done, false);
    });
    await asUser(db, BOB, async () => {
      await assert.rejects(db.query("select public.read_arena_ranking($1,'year')", [arena]), e => e.code === '23514');
      await db.query('select public.remove_arena_checkin($1,$2)', [arena, await shift(db, -6)]);
    });
    assert.equal((await db.query('select count(*)::int n from public.arena_checkins')).rows[0].n, 1);
  } finally { await db.close(); }
});

test('ranking orders by days, hides blocked people and exposes no direct table access', async () => {
  const db = await createTestDatabase();
  const arena = randomUUID();
  try {
    await db.query("insert into public.arenas(id,slug,name,city,neighborhood) values($1,'arena-rank-teste','Arena ranking','São Paulo','Teste')", [arena]);
    await db.query('insert into public.arena_sports(arena_id,sport_id) values($1,$2)', [arena, FUTEVOLEI]);
    await db.query('update public.profiles set onboarding_completed = true where id in ($1,$2)', [ALICE, BOB]);
    await asUser(db, ALICE, async () => {
      await db.query('select public.record_arena_checkin($1)', [arena]);
      await db.query('select public.record_arena_checkin($1,$2)', [arena, await shift(db, -2)]);
    });
    await asUser(db, BOB, async () => { await db.query('select public.record_arena_checkin($1)', [arena]); });
    await asUser(db, BOB, async () => {
      const r = (await db.query("select public.read_arena_ranking($1,'all') r", [arena])).rows[0].r;
      assert.deepEqual(r.entries.map(e => [e.player_id, e.rank, e.days]), [[ALICE, 1, 2], [BOB, 2, 1]]);
      assert.deepEqual(r.me, { rank: 2, days: 1 });
      await assert.rejects(db.query('select * from public.arena_checkins'), e => e.code === '42501');
      assert.ok((await db.query("select public.read_arenas_activity('month') r")).rows[0].r.arenas.length <= 5);
    });
    await db.query('insert into public.blocks(blocker_id,blocked_id) values($1,$2)', [BOB, ALICE]);
    await asUser(db, BOB, async () => {
      const r = (await db.query("select public.read_arena_ranking($1,'all') r", [arena])).rows[0].r;
      assert.deepEqual(r.entries.map(e => e.player_id), [BOB]);
    });
  } finally { await db.close(); }
});

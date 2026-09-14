import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';

test('declared played arena is public, reversible and independent of private games and follows', async () => {
  const db = await createTestDatabase();
  const arena = randomUUID();
  const game = randomUUID();
  try {
    await db.query("insert into public.arenas(id,slug,name,city,neighborhood) values($1,'arena-real-teste','Arena real de teste','São Paulo','Teste')", [arena]);
    await db.query('insert into public.arena_sports(arena_id,sport_id) values($1,$2)', [arena, FUTEVOLEI]);
    await asUser(db, ALICE, async () => {
      await db.query("select public.save_played_game($1,$2,$3,'2026-01-01')", [game, arena, FUTEVOLEI]);
      assert.deepEqual((await db.query('select public.read_played_arena_marks() r')).rows[0].r, []);
    });
    await asUser(db, BOB, async () => {
      assert.deepEqual((await db.query('select public.read_played_arena_marks($1) r', [ALICE])).rows[0].r, []);
      assert.deepEqual((await db.query('select public.read_played_games() r')).rows[0].r, []);
    });
    await asUser(db, ALICE, async () => {
      await assert.rejects(db.query('select public.set_played_arena_mark($1,true)', [VILA]), e => e.code === '23514');
      await db.query('select public.set_played_arena_mark($1,true)', [arena]);
      await db.query('select public.set_played_arena_mark($1,true)', [arena]);
      assert.deepEqual((await db.query('select public.read_played_arena_marks() r')).rows[0].r.map(p => p.id), [arena]);
      assert.equal((await db.query('select count(*)::int n from public.arena_members where arena_id=$1 and player_id=$2', [arena, ALICE])).rows[0].n, 0);
    });
    await asUser(db, BOB, async () => {
      const marks = (await db.query('select public.read_played_arena_marks($1) r', [ALICE])).rows[0].r;
      assert.deepEqual(marks, [{ id: arena, name: 'Arena real de teste', slug: 'arena-real-teste' }]);
      await assert.rejects(db.query('select * from public.arena_played_marks'), e => e.code === '42501');
      await assert.rejects(db.query('insert into public.arena_played_marks(arena_id,player_id) values($1,$2)', [arena, ALICE]), e => e.code === '42501');
      assert.deepEqual((await db.query('select public.read_played_games() r')).rows[0].r, []);
    });
    await asUser(db, null, async () => {
      await assert.rejects(db.query('select public.read_played_arena_marks($1)', [ALICE]), e => e.code === '42501');
      await assert.rejects(db.query('select public.set_played_arena_mark($1,true)', [arena]), e => e.code === '42501');
    });
    await db.query('insert into public.blocks(blocker_id,blocked_id) values($1,$2)', [ALICE, BOB]);
    await asUser(db, BOB, async () => assert.deepEqual((await db.query('select public.read_played_arena_marks($1) r', [ALICE])).rows[0].r, []));
    await asUser(db, ALICE, async () => {
      await db.query('select public.set_played_arena_mark($1,false)', [arena]);
      await db.query('select public.set_played_arena_mark($1,false)', [arena]);
      assert.deepEqual((await db.query('select public.read_played_arena_marks() r')).rows[0].r, []);
      assert.equal((await db.query('select public.read_played_games() r')).rows[0].r.length, 1);
    });
  } finally { await db.close(); }
});

test('own declarations remain removable after an arena becomes private or inactive', async () => {
  const db = await createTestDatabase();
  const arena = randomUUID();
  try {
    await db.query("insert into public.arenas(id,slug,name,city,neighborhood) values($1,'arena-oculta-teste','Arena oculta de teste','São Paulo','Teste')", [arena]);
    await asUser(db, ALICE, () => db.query('select public.set_played_arena_mark($1,true)', [arena]));
    await db.query('update public.arenas set is_public=false where id=$1', [arena]);
    await asUser(db, ALICE, async () => {
      assert.deepEqual((await db.query('select public.read_played_arena_marks() r')).rows[0].r, []);
      assert.deepEqual((await db.query('select public.read_own_played_arena_marks() r')).rows[0].r,
        [{ id: arena, name: 'Arena oculta de teste', visible: false }]);
    });
    await db.query("update public.arenas set is_public=true,status='archived' where id=$1", [arena]);
    await asUser(db, ALICE, async () => {
      assert.deepEqual((await db.query('select public.read_played_arena_marks() r')).rows[0].r, []);
      assert.deepEqual((await db.query('select public.read_own_played_arena_marks() r')).rows[0].r,
        [{ id: arena, name: 'Arena oculta de teste', visible: false }]);
    });
    await asUser(db, BOB, async () => {
      assert.deepEqual((await db.query('select public.read_played_arena_marks($1) r', [ALICE])).rows[0].r, []);
      assert.deepEqual((await db.query('select public.read_own_played_arena_marks() r')).rows[0].r, []);
    });
    await asUser(db, null, () => assert.rejects(db.query('select public.read_own_played_arena_marks()'), e => e.code === '42501'));
    await db.query("update pico_private.write_limits set used=30 where player_id=$1 and action='arena_played_mark'", [ALICE]);
    await asUser(db, ALICE, async () => {
      await db.query('select public.set_played_arena_mark($1,false)', [arena]);
      assert.deepEqual((await db.query('select public.read_own_played_arena_marks() r')).rows[0].r, []);
      await assert.rejects(db.query('select public.set_played_arena_mark($1,true)', [arena]), e => e.code === 'P0429');
    });
    await db.query("update pico_private.write_limits set used=0 where player_id=$1 and action='arena_played_mark'", [ALICE]);
    await asUser(db, ALICE, () => assert.rejects(db.query('select public.set_played_arena_mark($1,true)', [arena]), e => e.code === '23514'));
    await db.query("update public.arenas set is_public=true,status='active' where id=$1", [arena]);
    await asUser(db, ALICE, async () => assert.deepEqual((await db.query('select public.read_played_arena_marks() r')).rows[0].r, []));
  } finally { await db.close(); }
});

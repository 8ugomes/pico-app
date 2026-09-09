import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI, BEACH, PRIVATE } from './helpers/database.mjs';
import { parseReadRequest } from '../src/lib/supabase/read-service.ts';
import { parseMutation } from '../src/lib/supabase/mutations.ts';
let db;
before(async () => {
  db = await createTestDatabase();
  for (const [id, name] of [[ALICE, 'alice'], [BOB, 'bob']]) await asUser(db, id, () => db.query(`select save_profile($1,$1,'Bora','São Paulo','Pinheiros',$2,'Intermediário',true)`, [name, FUTEVOLEI]));
});
after(async () => { await db?.close(); });
test('connections protect ownership, deny self-follow, duplicates and anonymous access', async () => {
  await asUser(db, ALICE, async () => {
    await assert.rejects(db.query('insert into connections(followed_id) values($1)', [ALICE]), e => e.code === '23514');
    await assert.rejects(db.query('insert into connections(follower_id,followed_id) values($1,$2)', [BOB, ALICE]), e => e.code === '42501');
    await db.query('insert into connections(followed_id) values($1)', [BOB]);
    await assert.rejects(db.query('insert into connections(followed_id) values($1)', [BOB]), e => e.code === '23505');
  });
  await asUser(db, BOB, async () => {
    assert.equal((await db.query('select * from connections')).rows.length, 0);
    assert.equal((await db.query('delete from connections where follower_id=$1 returning *', [ALICE])).rows.length, 0);
    await assert.rejects(db.query('update connections set followed_id=$1', [ALICE]), e => e.code === '42501');
  });
  await asUser(db, null, async () => { await assert.rejects(db.query('select * from connections'), e => e.code === '42501'); });
});
test('discovery excludes self/incomplete profiles and applies sport, level and active arena filters', async () => {
  await asUser(db, ALICE, async () => {
    const rows = (await db.query('select * from discover_players()')).rows;
    assert.equal(rows.length, 1); assert.equal(rows[0].id, BOB); assert.equal(rows[0].connected, true);
    assert.equal((await db.query('select * from discover_players(0,$1)', [BEACH])).rows.length, 0);
    assert.equal((await db.query(`select * from discover_players(p_level := 'Avançado')`)).rows.length, 0);
    assert.equal((await db.query('select * from discover_players(p_active := true)')).rows.length, 0);
  });
  await asUser(db, BOB, () => db.query('select start_checkin($1,$2)', [VILA, FUTEVOLEI]));
  await asUser(db, ALICE, async () => {
    assert.equal((await db.query('select * from discover_players(0,$1,$2,$3,true)', [FUTEVOLEI, VILA, 'Intermediário'])).rows.length, 1);
    assert.equal((await db.query('select * from discover_players(p_arena_id := $1)', [PRIVATE])).rows.length, 0);
    await db.query('delete from connections where followed_id=$1', [BOB]);
    assert.equal((await db.query('select * from discover_players()')).rows[0].connected, false);
  });
  await asUser(db, BOB, () => db.query('select end_checkin()'));
  await asUser(db, ALICE, () => db.query('select * from discover_players(p_active := true)')).then(r => assert.equal(r.rows.length, 0));
});
test('discovery remains bounded and malformed filters/forged follower are rejected', async () => {
  assert.throws(() => parseReadRequest(new URLSearchParams({ resource: 'discover', level: 'Pro' })));
  assert.throws(() => parseReadRequest(new URLSearchParams({ resource: 'discover', active: 'yes' })));
  assert.throws(() => parseReadRequest(new URLSearchParams({ resource: 'discover', arenaId: 'bad' })));
  assert.throws(() => parseMutation({ action: 'set_connection', playerId: BOB, connected: true, follower_id: ALICE }));
  await asUser(db, ALICE, async () => { await assert.rejects(db.query('select * from discover_players(10001)'), e => e.code === '23514'); });
  await asUser(db, null, async () => { await assert.rejects(db.query('select * from discover_players()'), e => e.code === '42501'); });
});

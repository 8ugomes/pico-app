import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB, FUTEVOLEI, BEACH } from './helpers/database.mjs';
import { parseMutation } from '../src/lib/supabase/mutations.ts';
let db;
before(async () => { db = await createTestDatabase(); });
after(async () => { await db?.close(); });
const input = { action: 'save_profile', name: 'Alice Nova', username: 'alice_nova', bio: 'Bora jogar', city: 'São Paulo', neighborhood: 'Pinheiros', sportId: FUTEVOLEI, level: 'Intermediário', available: true };
const save = (sport = FUTEVOLEI, username = 'alice_nova') => db.query(`select public.save_profile('Alice Nova',$1,'Bora jogar','São Paulo','Pinheiros',$2,'Intermediário',true)`, [username, sport]);
test('profile input rejects forged identity, invalid fields and normalizes username', () => {
  assert.equal(parseMutation({ ...input, username: ' ALICE_NOVA ' }).username, 'alice_nova');
  for (const bad of [{ player_id: BOB }, { id: BOB }, { name: ' ' }, { username: 'email@test.com' }, { sportId: 'bad' }, { level: 'Pro' }, { available: 'true' }, { bio: 'a'.repeat(161) }]) assert.throws(() => parseMutation({ ...input, ...bad }));
});
test('onboarding commits own profile and one primary sport atomically', async () => {
  await asUser(db, ALICE, async () => {
    await save();
    const profile = (await db.query('select * from profiles where id=$1', [ALICE])).rows[0];
    assert.equal(profile.display_name, 'Alice Nova'); assert.equal(profile.onboarding_completed, true);
    await save(BEACH);
    const sports = (await db.query('select * from player_sports where player_id=$1 and is_primary', [ALICE])).rows;
    assert.equal(sports.length, 1); assert.equal(sports[0].sport_id, BEACH);
    await assert.rejects(save('99999999-0000-4000-8000-000000000000', 'must_rollback'), e => e.code === '23503');
    assert.equal((await db.query('select username from profiles where id=$1', [ALICE])).rows[0].username, 'alice_nova');
    assert.equal((await db.query('select sport_id from player_sports where player_id=$1 and is_primary', [ALICE])).rows[0].sport_id, BEACH);
  });
  assert.equal((await db.query('select onboarding_completed from profiles where id=$1', [BOB])).rows[0].onboarding_completed, false);
});
test('anonymous onboarding denied, duplicate username rolls back other user', async () => {
  await asUser(db, null, async () => { await assert.rejects(save(), e => e.code === '42501'); });
  await asUser(db, BOB, async () => { await assert.rejects(save(), e => e.code === '23505'); });
  assert.equal((await db.query('select display_name from profiles where id=$1', [BOB])).rows[0].display_name, 'Novo jogador');
});

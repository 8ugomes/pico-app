import assert from 'node:assert/strict';
import test from 'node:test';

import { ALICE, asUser, createTestDatabase } from './helpers/database.mjs';

test('estado móvel mantém direitos da conta fora do acesso social', async () => {
  const db = await createTestDatabase();
  try {
    assert.equal((await asUser(db, ALICE, () => db.query('select public.mobile_account_access_state() state'))).rows[0].state, 'active');
    await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1", [ALICE]);
    assert.equal((await asUser(db, ALICE, () => db.query('select public.mobile_account_access_state() state'))).rows[0].state, 'suspended');
    await db.query("update pico_private.beta_admissions set status='revoked' where player_id=$1", [ALICE]);
    assert.equal((await asUser(db, ALICE, () => db.query('select public.mobile_account_access_state() state'))).rows[0].state, 'revoked');
    await db.query('insert into public.account_deletions(player_id) values($1)', [ALICE]);
    assert.equal((await asUser(db, ALICE, () => db.query('select public.mobile_account_access_state() state'))).rows[0].state, 'deletion_pending');
  } finally {
    await db.close();
  }
});

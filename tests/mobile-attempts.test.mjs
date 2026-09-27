import assert from 'node:assert/strict';
import test from 'node:test';

import { createAttemptRepository } from '../apps/mobile/attempts.ts';

const ACCOUNT = '11111111-1111-4111-8111-111111111111';
const POST = '22222222-2222-4222-8222-222222222222';
const GAME = '33333333-3333-4333-8333-333333333333';

class MemoryPreferences {
  values = new Map();
  async get({ key }) { return { value: this.values.get(key) ?? null }; }
  async set({ key, value }) { this.values.set(key, value); }
  async remove({ key }) { this.values.delete(key); }
}

test('comentário reutiliza a chave após relaunch e só limpa a tentativa confirmada', async () => {
  const storage = new MemoryPreferences();
  const first = createAttemptRepository(storage);
  const attempt = await first.comment(ACCOUNT, POST, 'Bora jogar amanhã?');

  const relaunched = createAttemptRepository(storage);
  assert.deepEqual(await relaunched.comment(ACCOUNT, POST, 'Bora jogar amanhã?'), attempt);
  assert.equal(await relaunched.confirmComment(ACCOUNT, crypto.randomUUID()), false);
  assert.equal(await relaunched.confirmComment(ACCOUNT, attempt.key), true);

  const next = await relaunched.comment(ACCOUNT, POST, 'Outro comentário');
  assert.notEqual(next.key, attempt.key);
});

test('compartilhamento de jogo preserva payload e chave até confirmação', async () => {
  const storage = new MemoryPreferences();
  const first = createAttemptRepository(storage);
  const value = {
    key: crypto.randomUUID(),
    gameId: GAME,
    gameVersion: 2,
    body: 'Jogo de domingo.',
    audience: 'beta',
    wallArena: '',
    groups: [],
  };
  await first.saveGameShare(ACCOUNT, value);

  const relaunched = createAttemptRepository(storage);
  assert.deepEqual(await relaunched.loadGameShare(ACCOUNT, GAME, 2), value);
  assert.equal(await relaunched.loadGameShare(ACCOUNT, GAME, 3), null);
  assert.equal(await relaunched.confirmGameShare(ACCOUNT, value.key), true);
  assert.equal(await relaunched.loadGameShare(ACCOUNT, GAME, 2), null);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionGeneration } from '../apps/mobile/session-generation.ts';

test('resposta autenticada tardia fica inválida depois do logout', async () => {
  const session = new SessionGeneration();
  const generation = session.capture();
  let resolve;
  const response = new Promise((done) => { resolve = done; });
  const guarded = response.then(() => session.isCurrent(generation));

  session.invalidate();
  resolve();

  assert.equal(await guarded, false);
  assert.equal(session.isCurrent(session.capture()), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTourProgress, tourStepAt, tourStorageKey } from '../src/lib/onboarding.ts';

test('tutorial ignores corrupted, old or out-of-range browser preferences', () => {
  for (const value of [null, '', '{', 'null', '{}', '{"version":0,"status":"active","step":0}', '{"version":1,"status":"active","step":6}', '{"version":1,"status":"active","step":-1}', '{"version":1,"status":"active","step":1.5}', '{"version":1,"status":"sent","step":0}']) assert.equal(parseTourProgress(value), null);
  assert.deepEqual(parseTourProgress('{"version":1,"status":"paused","step":4,"content":"discard"}'), { version: 1, status: 'paused', step: 4 });
});

test('tutorial follows social details but never treats management or auth as a guided action', () => {
  for (const [path, step] of [['/arenas/areia', 0], ['/perfil/jogador', 1], ['/comunidades/turma', 2], ['/publicacoes/post', 3], ['/jogos', 4], ['/perfil', 5]]) assert.equal(tourStepAt(path), step);
  for (const path of ['/arenas/areia/gestao', '/comunidades/turma/gestao', '/admin', '/conta', '/login', '/signup', '/acesso', '/perfil/outra/rota']) assert.equal(tourStepAt(path), null);
});

test('browser preferences are separated between accounts and the demonstration', () => {
  assert.equal(new Set(['demo', 'account:a', 'account:b'].map(tourStorageKey)).size, 3);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTourProgress, tourSteps, tourStepAt, tourStorageKey } from '../src/lib/onboarding.ts';

test('tutorial has three essential steps and migrates valid v1 preferences', () => {
  assert.deepEqual(tourSteps.map(step => step.id), ['arenas', 'people', 'games']);
  for (const value of [null, '', '{', 'null', '{}', '{"version":0,"status":"active","step":0}', '{"version":2,"status":"active","step":3}', '{"version":2,"status":"active","step":-1}', '{"version":2,"status":"active","step":1.5}', '{"version":2,"status":"sent","step":0}']) assert.equal(parseTourProgress(value), null);
  assert.deepEqual(parseTourProgress('{"version":2,"status":"paused","step":1,"content":"discard"}'), { version: 2, status: 'paused', step: 1 });
  assert.deepEqual(parseTourProgress('{"version":1,"status":"paused","step":4}'), { version: 2, status: 'paused', step: 2 });
  assert.deepEqual(parseTourProgress('{"version":1,"status":"complete","step":5}'), { version: 2, status: 'complete', step: 2 });
});

test('tutorial follows social details but never treats management or auth as a guided action', () => {
  for (const [path, step] of [['/arenas/areia', 0], ['/perfil/jogador', 1], ['/comunidades', 1], ['/comunidades/turma', 1], ['/jogos', 2]]) assert.equal(tourStepAt(path), step);
  for (const path of ['/feed', '/perfil', '/publicacoes/post', '/arenas/areia/gestao', '/comunidades/turma/gestao', '/admin', '/conta', '/login', '/signup', '/acesso', '/perfil/outra/rota']) assert.equal(tourStepAt(path), null);
});

test('browser preferences are separated between accounts and the demonstration', () => {
  assert.equal(new Set(['demo', 'account:a', 'account:b'].map(tourStorageKey)).size, 3);
});

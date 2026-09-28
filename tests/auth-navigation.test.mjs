import test from 'node:test';
import assert from 'node:assert/strict';
import { afterLogin, authDestination, clearInvitation, pendingInvitation, rememberInvitation, safeNext } from '../src/lib/auth/navigation.ts';

function withSessionStorage(run) {
  const original = globalThis.sessionStorage;
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  try { run(); }
  finally {
    clearInvitation();
    if (original === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = original;
  }
}

test('login and signup links preserve supported Pico destinations', () => {
  for (const next of [
    '/feed',
    '/descobrir',
    '/perfil/jogadora',
    '/arenas/praia-central',
    '/comunidades/turma-da-areia',
    '/publicacoes/70000000-0000-4000-8000-000000000001',
    '/mensagens/70000000-0000-4000-8000-000000000001',
    '/convite/comunidade',
    '/convite/arena',
  ]) {
    assert.equal(safeNext(next), next);
    assert.equal(new URL(authDestination('login', next), 'https://pico.invalid').searchParams.get('next'), next);
    assert.equal(new URL(authDestination('signup', next), 'https://pico.invalid').searchParams.get('next'), next);
  }
});

test('auth links replace unsafe, ambiguous or repeated destinations with the profile', () => {
  for (const next of [
    null,
    ['/feed'],
    ['/feed', '/perfil'],
    'https://evil.invalid/perfil',
    '//evil.invalid/perfil',
    '/perfil?token=private',
    '/perfil#private',
    '/perfil/../admin',
    '/feed?next=/admin',
  ]) {
    assert.equal(safeNext(next), '/perfil');
    assert.equal(authDestination('login', next), '/login?next=%2Fperfil');
    assert.equal(authDestination('signup', next), '/signup?next=%2Fperfil');
  }
});

test('login return only reuses a pending invitation when explicit next matches it', () => withSessionStorage(() => {
  const token = 'a'.repeat(64);
  rememberInvitation('/convite/arena', token);
  assert.equal(afterLogin('/convite/arena'), '/convite/arena');
  assert.equal(pendingInvitation()?.token, token);

  assert.equal(afterLogin('/feed'), '/feed');
  assert.equal(pendingInvitation(), null);
}));

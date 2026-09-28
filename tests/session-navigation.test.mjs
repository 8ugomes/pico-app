import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelInvitationAccountSwitch,
  pendingInvitation,
  prepareInvitationAccountSwitch,
  rememberInvitation,
  resetAccountView,
} from '../src/lib/auth/navigation.ts';

const originalWindow = globalThis.window;
const originalStorage = globalThis.sessionStorage;

function browserState() {
  const paths = [];
  const values = new Map();
  globalThis.window = { location: { replace: path => paths.push(path) } };
  globalThis.sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  return paths;
}

test.afterEach(() => {
  cancelInvitationAccountSwitch();
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalStorage === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = originalStorage;
});

test('Auth event and logout completion discard the account view with one navigation', () => {
  const paths = browserState();
  resetAccountView();
  resetAccountView();
  resetAccountView(true);
  assert.deepEqual(paths, ['/login']);
});

test('wrong-account logout preserves the exact pending invitation across the auth event race', () => {
  const paths = browserState();
  const token = 'b'.repeat(64);
  rememberInvitation('/convite/comunidade', token);
  assert.equal(prepareInvitationAccountSwitch('/convite/comunidade'), true);

  resetAccountView();
  resetAccountView();

  assert.deepEqual(paths, ['/login?next=%2Fconvite%2Fcomunidade']);
  assert.equal(pendingInvitation()?.token, token);
});

test('failed signout cancels invitation preservation before a later session reset', () => {
  const paths = browserState();
  rememberInvitation('/convite/arena', 'c'.repeat(64));
  assert.equal(prepareInvitationAccountSwitch('/convite/arena'), true);
  cancelInvitationAccountSwitch();

  resetAccountView();

  assert.deepEqual(paths, ['/login']);
  assert.equal(pendingInvitation(), null);
});

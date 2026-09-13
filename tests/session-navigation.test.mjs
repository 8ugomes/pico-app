import test from 'node:test';
import assert from 'node:assert/strict';
import { resetAccountView } from '../src/lib/auth/navigation.ts';

test('Auth event and logout completion discard the account view with one navigation', () => {
  const original = globalThis.window;
  const paths = [];
  globalThis.window = { location: { replace: path => paths.push(path) } };
  try {
    resetAccountView();
    resetAccountView();
    resetAccountView(true);
    assert.deepEqual(paths, ['/login']);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});

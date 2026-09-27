import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  MOBILE_CLIENT_VERSION,
  MobileRequestError,
  mobileCorsHeaders,
  mobileJson,
  validateMobileRequest,
} from '../src/lib/mobile/api-contract.ts';

const request = (headers = {}) => new Request('https://pico-app-sepia.vercel.app/api/mobile/v1/social', {
  headers: {
    Origin: 'capacitor://localhost',
    'X-Pico-Client-Version': MOBILE_CLIENT_VERSION,
    ...headers,
  },
});

test('mobile API allows only the exact packaged-app origin', () => {
  assert.equal(
    mobileCorsHeaders('capacitor://localhost')['Access-Control-Allow-Origin'],
    'capacitor://localhost',
  );
  assert.equal(mobileCorsHeaders('capacitor://localhost.evil')['Access-Control-Allow-Origin'], undefined);
  assert.equal(mobileCorsHeaders('https://pico-app-sepia.vercel.app')['Access-Control-Allow-Origin'], undefined);
});

test('mobile API rejects cookies even when a Bearer token is present', () => {
  assert.throws(
    () => validateMobileRequest(request({ Authorization: 'Bearer access-token', Cookie: 'session=browser' })),
    (error) => error instanceof MobileRequestError && error.status === 400,
  );
});

test('mobile API rejects missing, malformed and obsolete client versions', () => {
  assert.throws(
    () => validateMobileRequest(request({ 'X-Pico-Client-Version': '' })),
    (error) => error instanceof MobileRequestError && error.status === 400,
  );
  assert.throws(
    () => validateMobileRequest(request({ 'X-Pico-Client-Version': 'preview' })),
    (error) => error instanceof MobileRequestError && error.status === 400,
  );
  assert.throws(
    () => validateMobileRequest(request({ 'X-Pico-Client-Version': '0.9.9' })),
    (error) => error instanceof MobileRequestError && error.status === 426,
  );
});

test('mobile API accepts a current client and returns only a strict Bearer credential', () => {
  assert.deepEqual(
    validateMobileRequest(request({ Authorization: 'Bearer access-token' })),
    { accessToken: 'access-token', clientVersion: MOBILE_CLIENT_VERSION, origin: 'capacitor://localhost' },
  );
  assert.throws(
    () => validateMobileRequest(request({ Authorization: 'Basic access-token' })),
    (error) => error instanceof MobileRequestError && error.status === 401,
  );
  assert.deepEqual(
    validateMobileRequest(request(), { requireAuth: false }),
    { accessToken: null, clientVersion: MOBILE_CLIENT_VERSION, origin: 'capacitor://localhost' },
  );
});

test('mobile responses expose one non-secret request id for support correlation', async () => {
  const response = mobileJson(request(), { data: { ok: true } });
  const body = await response.json();
  assert.match(response.headers.get('x-pico-request-id') ?? '', /^[0-9a-f-]{36}$/);
  assert.equal(body.requestId, response.headers.get('x-pico-request-id'));
  assert.deepEqual(body.data, { ok: true });
});

test('mobile sign-out revokes only this device and never reports success after an auth error', async () => {
  const route = await readFile(new URL('../src/app/api/mobile/v1/auth/route.ts', import.meta.url), 'utf8');
  assert.match(route, /if \(sessionError\)[\s\S]*throw new MobileRequestError\(401, 'invalid_session'/);
  assert.match(route, /signOut\(\{ scope: 'local' \}\)/);
  assert.match(route, /if \(signOutError\)[\s\S]*throw new MobileRequestError\(503, 'sign_out_unavailable'/);
  assert.doesNotMatch(route, /scope: 'global'/);
});

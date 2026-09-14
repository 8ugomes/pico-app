import test from 'node:test';
import assert from 'node:assert/strict';
import { createHealthHandler } from '../src/lib/health.ts';

const config = { url: 'https://health.example', key: 'sb_publishable_test', purpose: 'beta', projectRef: 'primary-test' };
const identity = { purpose: config.purpose, projectRef: config.projectRef };
const settings = { external: { email: true } };
const success = async url => Response.json(url.includes('/rpc/') ? identity : settings);

test('health checks only identity and Auth settings, without user/session credentials', async () => {
  const calls = [];
  const check = createHealthHandler(() => config, async (url, options) => {
    calls.push({ url, options });
    return success(url);
  });
  const response = await check();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.deepEqual(data.checks, { database: true, auth: true });
  assert.deepEqual(calls.map(call => [call.url, call.options.method, call.options.body]), [
    [config.url + '/rest/v1/rpc/environment_identity', 'POST', '{}'],
    [config.url + '/auth/v1/settings', 'GET', undefined],
  ]);
  for (const { options } of calls) {
    assert.equal(options.headers.apikey, config.key);
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
  }
  assert.doesNotMatch(JSON.stringify(data), /sb_publishable|health\.example|primary-test/);
});

test('demo or missing configuration is unhealthy without sending any request', async () => {
  const check = createHealthHandler(() => null, () => assert.fail('must not fetch'));
  const response = await check();
  assert.equal(response.status, 503);
  assert.deepEqual((await response.json()).checks, { database: false, auth: false });
});

for (const [label, database, auth] of [
  ['wrong database identity', { ...identity, projectRef: 'another-project' }, settings],
  ['wrong environment purpose', { ...identity, purpose: 'development' }, settings],
  ['password Auth unavailable', identity, { external: { email: false } }],
  ['unexpected database body', null, settings],
  ['unexpected Auth body', identity, ['not-settings']],
]) {
  test(`health returns 503 for ${label}`, async () => {
    const check = createHealthHandler(() => config, async url => Response.json(url.includes('/rpc/') ? database : auth));
    const response = await check();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).status, 'error');
  });
}

test('upstream failure and invalid JSON are sanitized', async () => {
  for (const fail of [
    async () => new Response('private upstream error', { status: 500 }),
    async () => new Response('private invalid JSON'),
    async () => { throw Error('private connection details'); },
  ]) {
    const response = await createHealthHandler(() => config, fail)();
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private/);
  }
});

test('timeout aborts both reads and returns an unhealthy response', async () => {
  let aborted = 0;
  const check = createHealthHandler(() => config, async (_url, { signal }) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(Response.json(settings)), 5000);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      aborted++;
      reject(signal.reason);
    }, { once: true });
  }), { timeoutMs: 15 });
  assert.equal((await check()).status, 503);
  assert.equal(aborted, 2);
});

test('concurrent requests share a snapshot, expire, detect failure and recover', async () => {
  let now = 0;
  let calls = 0;
  let healthy = true;
  const check = createHealthHandler(() => config, async url => {
    calls++;
    return healthy ? success(url) : new Response(null, { status: 503 });
  }, { now: () => now });
  const responses = await Promise.all(Array.from({ length: 20 }, () => check()));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(calls, 2);
  now = 29_999;
  assert.equal((await check()).status, 200);
  assert.equal(calls, 2);
  now = 30_000;
  healthy = false;
  assert.equal((await check()).status, 503);
  assert.equal(calls, 4);
  now = 60_000;
  healthy = true;
  assert.equal((await check()).status, 200);
  assert.equal(calls, 6);
});

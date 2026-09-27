import test from 'node:test';
import assert from 'node:assert/strict';
import { beginPushEnrollment, cancelPushAttempt, reconcileDevicePush, rememberPushOwner, removeDevicePush } from '../src/lib/push/client.ts';

test('push reconciliation revokes foreign or unauthenticated device bindings and preserves same-account temporary failures', async () => {
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldFetch = globalThis.fetch;
  const storage = new Map();
  let cancelled = 0;
  let closed = 0;
  let current;
  const reset = () => { current = { endpoint: 'https://fcm.googleapis.com/fcm/send/test:APA', unsubscribe: async () => { cancelled += 1; current = null; return true; } }; };
  const registration = { active: { scriptURL: 'https://pico.example/push-sw.js' }, pushManager: { getSubscription: async () => current }, getNotifications: async () => [{ close: () => { closed += 1; } }] };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: { getRegistration: async () => registration } } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  try {
    reset(); rememberPushOwner('alice');
    const finishEnrollment = beginPushEnrollment('alice');
    globalThis.fetch = async () => { assert.fail('focus must not reconcile an enrollment before the API saves it'); };
    await reconcileDevicePush('alice');
    finishEnrollment();
    assert.equal(cancelled, 0);
    globalThis.fetch = async () => Response.json({ data: { enabled: true, subscribed: true } });
    await reconcileDevicePush('alice');
    assert.equal(cancelled, 0);
    await reconcileDevicePush('bob');
    assert.equal(cancelled, 1); assert.equal(closed, 1);
    reset(); rememberPushOwner('alice');
    globalThis.fetch = async () => { throw Error('offline'); };
    await reconcileDevicePush('alice');
    assert.equal(cancelled, 1); // Known owner keeps a valid opt-in during a transient outage.
    rememberPushOwner(null);
    await reconcileDevicePush('alice');
    assert.equal(cancelled, 2); // Unknown ownership fails closed, even offline.
    reset(); rememberPushOwner('alice');
    await reconcileDevicePush(null);
    assert.equal(cancelled, 3);
    reset(); rememberPushOwner('alice');
    globalThis.fetch = async () => Response.json({ status: 'error' }, { status: 401 });
    await reconcileDevicePush('alice');
    assert.equal(cancelled, 4);
    reset(); rememberPushOwner('alice');
    globalThis.fetch = async (_url, init) => {
      assert.equal(init.keepalive, true); assert.equal(init.cache, 'no-store');
      return Response.json({ data: { subscribed: false } });
    };
    await removeDevicePush('https://fcm.googleapis.com/fcm/send/different');
    assert.equal(cancelled, 4); // Stale cleanup cannot remove a newly created endpoint.
    await removeDevicePush();
    assert.equal(cancelled, 5);
    let ambiguousRevoked = false;
    globalThis.fetch = async (_url, init) => { ambiguousRevoked = JSON.parse(init.body).endpoint.endsWith('/old-attempt'); return Response.json({ data: { subscribed: false } }); };
    await cancelPushAttempt({ endpoint: 'https://fcm.googleapis.com/fcm/send/old-attempt', unsubscribe: async () => { throw Error('browser revoke failed'); } });
    assert.equal(ambiguousRevoked, true); // Lost responses still attempt server revocation independently.
  } finally {
    globalThis.fetch = oldFetch;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator); else delete globalThis.navigator;
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else delete globalThis.localStorage;
  }
});

test('an old account status response cannot cancel or adopt the next account subscription', async () => {
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldFetch = globalThis.fetch;
  const storage = new Map();
  let cancelled = 0;
  let resolveOld;
  let oldStarted;
  const started = new Promise(resolve => { oldStarted = resolve; });
  const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test:APA', unsubscribe: async () => { cancelled += 1; return true; } };
  const registration = { active: { scriptURL: 'https://pico.example/push-sw.js' }, pushManager: { getSubscription: async () => subscription }, getNotifications: async () => [] };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: { getRegistration: async () => registration } } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  try {
    rememberPushOwner('alice');
    globalThis.fetch = async () => { oldStarted(); return new Promise(resolve => { resolveOld = resolve; }); };
    const first = reconcileDevicePush('alice');
    await started;
    rememberPushOwner('bob');
    globalThis.fetch = async () => Response.json({ data: { subscribed: true } });
    await reconcileDevicePush('bob');
    resolveOld(Response.json({ data: { subscribed: false } }));
    await first;
    assert.equal(cancelled, 0); assert.equal(storage.get('pico.push-owner.v1'), 'bob');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator); else delete globalThis.navigator;
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else delete globalThis.localStorage;
  }
});

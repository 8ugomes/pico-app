import test from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { authorizedPushDispatch, getPushConfig, parsePushSubscription, pushEndpoint } from '../src/lib/push/policy.ts';
import { deliverPush } from '../src/lib/push/delivery.ts';

function keys() {
  const pair = createECDH('prime256v1');
  pair.generateKeys();
  const scalar = pair.getPrivateKey();
  const privateKey = Buffer.alloc(32);
  scalar.copy(privateKey, privateKey.length - scalar.length);
  return { publicKey: pair.getPublicKey().toString('base64url'), privateKey: privateKey.toString('base64url') };
}
const vapid = keys();
const receiver = keys();
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/device:APA91_example', keys: { p256dh: receiver.publicKey, auth: randomBytes(16).toString('base64url') } };
const config = { ...vapid, subject: 'mailto:push@example.invalid', dispatchSecret: randomBytes(32).toString('hex') };

test('push subscription parser accepts real host/path shapes and rejects SSRF and invalid keys', () => {
  assert.deepEqual(parsePushSubscription({ ...subscription, expirationTime: null }), subscription);
  for (const endpoint of ['https://web.push.apple.com/Q_test-1', 'https://updates.push.services.mozilla.com/wpush/v2/test-1']) assert.equal(pushEndpoint(endpoint), endpoint);
  for (const endpoint of [
    'http://fcm.googleapis.com/fcm/send/x', 'https://fcm.googleapis.com:443/fcm/send/x',
    'https://fcm.googleapis.com.evil.example/fcm/send/x', 'https://user@fcm.googleapis.com/fcm/send/x',
    'https://127.0.0.1/fcm/send/x', 'https://169.254.169.254/latest/meta-data',
    'https://fcm.googleapis.com/fcm/send/x?next=https://evil.example', 'https://fcm.googleapis.com/fcm/send/x#part',
    'https://fcm.googleapis.com/fcm/send/../admin', 'https://fcm.googleapis.com/fcm/send/x%2Fadmin',
    'https://fcm.googleapis.com/fcm/send/x\n', 'https://web.push.apple.com.evil.example/x',
  ]) assert.throws(() => pushEndpoint(endpoint));
  assert.throws(() => parsePushSubscription({ ...subscription, owner: 'somebody-else' }));
  assert.throws(() => parsePushSubscription({ ...subscription, keys: { ...subscription.keys, p256dh: 'A'.repeat(87) } }));
  assert.throws(() => parsePushSubscription({ ...subscription, keys: { ...subscription.keys, auth: 'A'.repeat(21) } }));
  assert.throws(() => parsePushSubscription({ ...subscription, expirationTime: 1 }));
});

test('push configuration requires explicit activation and a matching private VAPID key', () => {
  const env = { PICO_WEB_PUSH_ENABLED: 'true', PICO_VAPID_PUBLIC_KEY: vapid.publicKey, PICO_VAPID_PRIVATE_KEY: vapid.privateKey,
    PICO_VAPID_SUBJECT: config.subject, PICO_PUSH_DISPATCH_SECRET: config.dispatchSecret };
  assert.deepEqual(getPushConfig(env), config);
  assert.equal(getPushConfig({ ...env, PICO_WEB_PUSH_ENABLED: 'false' }), null);
  assert.equal(getPushConfig({ ...env, PICO_VAPID_PRIVATE_KEY: receiver.privateKey }), null);
  assert.equal(getPushConfig({ ...env, PICO_PUSH_DISPATCH_SECRET: '' }), null);
  assert.equal(getPushConfig({ ...env, PICO_VAPID_SUBJECT: 'not-a-contact' }), null);
  assert.equal(authorizedPushDispatch('Bearer ' + config.dispatchSecret, config.dispatchSecret), true);
  for (const header of [null, 'Basic ' + config.dispatchSecret, 'Bearer wrong', 'Bearer ' + config.dispatchSecret + 'x']) assert.equal(authorizedPushDispatch(header, config.dispatchSecret), false);
  assert.equal(authorizedPushDispatch('Bearer undefined', undefined), false);
});

test('delivery encrypts generic payload, refuses redirects and sanitizes provider outcomes', async () => {
  const delivery = { ...subscription, kind: 'message', ttl: 100 };
  let calls = 0;
  const result = await deliverPush(delivery, config, async (url, init) => {
    calls += 1;
    assert.equal(url, subscription.endpoint);
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store');
    assert.equal(init.method, 'POST'); assert.equal(init.headers.TTL, 100);
    assert.equal(init.headers['Content-Encoding'], 'aes128gcm');
    assert.ok(init.body instanceof Uint8Array);
    assert.equal(Buffer.from(init.body).includes(Buffer.from('message')), false);
    return new Response(null, { status: 201 });
  });
  assert.equal(calls, 1); assert.deepEqual(result, { outcome: 'sent', retryAfter: 0 });
  for (const [status, outcome] of [[404, 'gone'], [410, 'gone'], [429, 'retry'], [503, 'retry'], [403, 'retry'], [400, 'discarded'], [307, 'discarded']]) {
    const value = await deliverPush(delivery, config, async () => new Response(null, { status, headers: { 'Retry-After': '7200' } }));
    assert.equal(value.outcome, outcome);
    if (outcome === 'retry') assert.equal(value.retryAfter, 3600);
  }
  const failed = await deliverPush(delivery, config, async () => { throw Error('private endpoint and keys must never escape'); });
  assert.deepEqual(failed, { outcome: 'retry', retryAfter: 0 });
  await assert.rejects(deliverPush({ ...delivery, endpoint: 'http://localhost/secret' }, config, async () => { assert.fail('must not request'); }));
});

test('push worker reveals no payload content and opens only a protected same-origin inbox', async () => {
  const listeners = new Map();
  const notifications = [];
  const opened = [];
  let focused = 0;
  let windows = [];
  const self = {
    location: { origin: 'https://pico.example' },
    addEventListener: (name, handler) => listeners.set(name, handler),
    registration: { showNotification: async (title, options) => notifications.push({ title, options }) },
    clients: { matchAll: async () => windows, openWindow: async url => opened.push(url) },
  };
  const forbidden = () => { throw Error('private storage or background network accessed'); };
  vm.runInNewContext(await readFile(new URL('../public/push-sw.js', import.meta.url), 'utf8'), { self, URL, fetch: forbidden, caches: { open: forbidden }, indexedDB: { open: forbidden } });
  assert.deepEqual([...listeners.keys()], ['push', 'notificationclick']);
  let pending;
  listeners.get('push')({ data: { json: () => ({ version: 1, kind: 'message', body: 'PRIVATE', actor: 'PRIVATE', url: 'https://evil.example' }) }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(notifications[0].options.body, 'Você tem novas mensagens no Pico.');
  assert.equal(JSON.stringify(notifications).includes('PRIVATE'), false);
  let closed = false;
  listeners.get('notificationclick')({ notification: { close: () => { closed = true; }, data: { path: 'https://evil.example' } }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(closed, true); assert.deepEqual(opened, ['https://pico.example/notificacoes']);
  windows = [{ url: 'https://pico.example/mensagens', focus: async () => { focused += 1; } }];
  listeners.get('notificationclick')({ notification: { close() {}, data: { path: '/mensagens' } }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(focused, 1); assert.equal(opened.length, 1);
  listeners.get('push')({ data: { json: () => { throw Error('bad json'); } }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(notifications.length, 2);
});

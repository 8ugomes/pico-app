import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Exercise the real Route Handler/validation/error mapping. Only the Auth and
// database transport is controlled here; database policies have separate tests.
const slot = '__picoMessagesHttpTest';
const result = await build({
  entryPoints: ['src/app/api/messages/route.ts'], bundle: true, write: false,
  platform: 'node', format: 'esm', tsconfig: 'tsconfig.json',
  plugins: [{ name: 'controlled-auth-transport', setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/supabase\/server$/ }, () => ({ path: 'test-client', namespace: 'pico-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'pico-test' }, () => ({ contents: `export async function createClient() { return globalThis.${slot}.client; }`, loader: 'js' }));
  } }],
});
const route = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const playerId = '30000000-0000-4000-8000-000000000001';
const conversationId = '70000000-0000-4000-8000-000000000001';
const url = 'https://pico.invalid/api/messages';

test('message HTTP boundary validates Auth, origin, feature availability and private cache headers', async () => {
  const old = process.env.PICO_DIRECT_MESSAGES_ENABLED;
  let calls = 0;
  let user = null;
  globalThis[slot] = { client: {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    rpc: async name => { calls++; return { data: name === 'open_direct_conversation' ? { id: conversationId } : { items: [], unreadCount: 0, nextCursor: null }, error: null }; },
  } };
  try {
    process.env.PICO_DIRECT_MESSAGES_ENABLED = 'false';
    assert.equal((await route.GET(new Request(url))).status, 503);
    process.env.PICO_DIRECT_MESSAGES_ENABLED = 'true';
    const denied = await route.GET(new Request(url));
    assert.equal(denied.status, 401);
    assert.match(denied.headers.get('cache-control'), /private, no-store/);
    assert.equal(denied.headers.get('vary'), 'Cookie');
    assert.equal(calls, 0);
    user = { id: playerId };
    const body = JSON.stringify({ action: 'open', playerId });
    assert.equal((await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://other.invalid', 'content-type': 'application/json' }, body }))).status, 403);
    assert.equal(calls, 0);
    assert.equal((await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://pico.invalid', 'content-type': 'application/json' }, body: JSON.stringify({ action: 'open', playerId, senderId: playerId }) }))).status, 400);
    const opened = await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://pico.invalid', 'content-type': 'application/json' }, body }));
    assert.equal(opened.status, 200);
    assert.deepEqual(await opened.json(), { data: { id: conversationId } });
    assert.equal(calls, 1);
    const inbox = await route.GET(new Request(url));
    assert.deepEqual(await inbox.json(), { data: { items: [], unreadCount: 0, nextCursor: null } });
    assert.equal(calls, 2);
    globalThis[slot].client.rpc = async () => ({ error: { code: '42501', message: 'private SQL statement' } });
    const blocked = await route.GET(new Request(url));
    assert.equal(blocked.status, 403);
    assert.ok(!(await blocked.text()).includes('private SQL'));
  } finally {
    delete globalThis[slot];
    if (old === undefined) delete process.env.PICO_DIRECT_MESSAGES_ENABLED;
    else process.env.PICO_DIRECT_MESSAGES_ENABLED = old;
  }
});

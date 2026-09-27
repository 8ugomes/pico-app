import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const slot = '__picoAccountExportHttpTest';
const modules = {
  '@/lib/supabase/server': `export async function createClient(){return globalThis.${slot}.client;}`,
  '@/lib/supabase/admin': `export function createAdminClient(){return globalThis.${slot}.admin;}`,
  '@/lib/mobile/supabase': `export function createMobileDataClient(){return globalThis.${slot}.client;} export async function requireMobileUser(){return globalThis.${slot}.user;}`,
  '@/lib/supabase/reauthenticate': `export async function reauthenticate(user,password){if(user.id!==globalThis.${slot}.id||password!=='test-only-password')throw Error('reauthentication failed');}`,
};
async function bundleRoute(entryPoint) {
  const bundle = await build({ entryPoints: [entryPoint], bundle: true, write: false, platform: 'node', format: 'esm', tsconfig: 'tsconfig.json', plugins: [{ name: 'controlled-export-transport', setup(builder) {
  builder.onResolve({ filter: /^@\/lib\/(supabase\/(server|admin|reauthenticate)|mobile\/supabase)$/ }, args => ({ path: args.path, namespace: 'test-export' }));
  builder.onLoad({ filter: /.*/, namespace: 'test-export' }, args => ({ contents: modules[args.path], loader: 'js' }));
} }] });
  return import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
}
const route = await bundleRoute('src/app/api/account/export/route.ts');
const mobileRoute = await bundleRoute('src/app/api/mobile/v1/account/export/route.ts');
const request = () => new Request('https://pico.invalid/api/account/export', { method: 'POST', headers: { origin: 'https://pico.invalid', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test-only-password' }) });
const mobileRequest = () => new Request('https://pico.invalid/api/mobile/v1/account/export', { method: 'POST', headers: { origin: 'capacitor://localhost', authorization: 'Bearer test-only-token', 'content-type': 'application/json', 'x-pico-client-version': '1.0.0' }, body: JSON.stringify({ password: 'test-only-password' }) });

test('account export retains sent messages after a feature rollback and tolerates only a missing pre-release RPC', async () => {
  const old = process.env.PICO_DIRECT_MESSAGES_ENABLED;
  const id = '30000000-0000-4000-8000-000000000001';
  let missing = false, huge = false;
  globalThis[slot] = { id, user: { id },
    client: { auth: { getUser: async () => ({ data: { user: { id } }, error: null }) } },
    admin: { rpc: async (name, args) => {
      assert.equal(args.p_user, id);
      if (name === 'export_account_messages') return missing ? { data: null, error: { code: 'PGRST202' } } : { data: { direct_messages_sent: [{ body: 'Mensagem própria' }] }, error: null };
      return { data: name === 'export_account_data' ? { own: huge ? 'x'.repeat(8 * 1024 * 1024) : 'profile' } : {}, error: null };
    } },
  };
  try {
    process.env.PICO_DIRECT_MESSAGES_ENABLED = 'false';
    let response = await route.POST(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.direct_messages_sent[0].body, 'Mensagem própria');
    response = await mobileRoute.POST(mobileRequest());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.data.direct_messages_sent[0].body, 'Mensagem própria');
    missing = true;
    response = await route.POST(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.own, 'profile');
    response = await mobileRoute.POST(mobileRequest());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.data.own, 'profile');
    process.env.PICO_DIRECT_MESSAGES_ENABLED = 'true';
    assert.equal((await route.POST(request())).status, 503);
    assert.equal((await mobileRoute.POST(mobileRequest())).status, 503);
    missing = false; huge = true;
    assert.equal((await route.POST(request())).status, 413, 'aggregate archive limit must include every section');
    assert.equal((await mobileRoute.POST(mobileRequest())).status, 413, 'mobile aggregate archive limit must include every section');
  } finally {
    delete globalThis[slot];
    if (old === undefined) delete process.env.PICO_DIRECT_MESSAGES_ENABLED; else process.env.PICO_DIRECT_MESSAGES_ENABLED = old;
  }
});

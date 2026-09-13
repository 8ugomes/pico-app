// Bounded, paced capacity rehearsal. Never runs against the primary database.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';

process.umask(0o077);
const env = await assertRemoteIdentity(process.env, 'hosted-test');
const origin = 'http://localhost:3002';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20000) }) } };
const admin = createClient(env.url, process.env.SUPABASE_SECRET_KEY, options);
const accounts = [], stages = [];
const directory = '.vercel/stability';
mkdirSync(directory, { recursive: true });
const manifest = () => writeFileSync(directory + '/fixtures.json', JSON.stringify({ projectRef: env.projectRef, userIds: accounts.map(a => a.id) }));
function ok(result) { assert.equal(result.error, null, 'controlled operation must succeed'); return result.data; }
const paths = ['/api/posts', '/api/social/read?resource=profile', '/api/games'];
const summary = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = fraction => Math.round(sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0);
  return { p50Ms: at(.5), p95Ms: at(.95), p99Ms: at(.99), maxMs: at(1) };
};
let completed = false, cleanupComplete = true, immediateSignup = false;
try {
  const version = await (await fetch(origin + '/api/version')).json();
  assert.equal(version.environment, 'development');
  for (let n = 0; n < 16; n++) {
    const email = 'pico-capacity-' + randomBytes(10).toString('hex') + '@example.com';
    const password = randomBytes(24).toString('base64url') + 'A9!';
    const jar = new Map();
    const client = createServerClient(env.url, key, { ...options, cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: items => items.forEach(({ name, value }) => value ? jar.set(name, value) : jar.delete(name)) } });
    let id;
    if (n === 0) {
      const signup = ok(await client.auth.signUp({ email, password }));
      assert.ok(signup.user);
      id = signup.user.id;
      accounts.push({ id, client, jar }); manifest();
      assert.ok(signup.session, 'signup returns a session without email confirmation');
      immediateSignup = true;
    } else {
      id = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user.id;
      accounts.push({ id, client, jar }); manifest();
      ok(await client.auth.signInWithPassword({ email, password }));
    }
    ok(await client.from('profiles').update({ display_name: 'Teste de capacidade ' + n, username: 'cap_' + id.replaceAll('-', '').slice(0, 15), onboarding_completed: true }).eq('id', id));
    ok(await client.rpc('publish_post', { p_key: randomUUID(), p_body: 'Publicação controlada de capacidade ' + n }));
  }
  for (const targetRps of [5, 15, 30]) {
    const durationMs = 30000, total = targetRps * durationMs / 1000, pending = new Set(), latencies = [], byRoute = paths.map(() => []), statuses = {};
    let dropped = 0, errors = 0, peak = 0, isolationFailure = false;
    const start = performance.now();
    for (let index = 0; index < total && errors < 3 && !isolationFailure; index++) {
      await delay(Math.max(0, start + index * 1000 / targetRps - performance.now()));
      if (pending.size >= 32) { dropped++; continue; }
      const user = accounts[index % accounts.length], route = index % paths.length;
      const task = (async () => {
        const at = performance.now();
        try {
          const response = await fetch(origin + paths[route], { headers: { Cookie: [...user.jar].map(([name, value]) => name + '=' + value).join('; ') }, signal: AbortSignal.timeout(12000) });
          statuses[response.status] = (statuses[response.status] ?? 0) + 1;
          const data = await response.json();
          if (!response.ok || !response.headers.get('cache-control')?.includes('no-store')) { errors++; return; }
          if (route === 1 && data.data?.profile?.id !== user.id) { isolationFailure = true; errors++; }
          const elapsed = performance.now() - at; latencies.push(elapsed); byRoute[route].push(elapsed);
        } catch { errors++; }
      })();
      pending.add(task); peak = Math.max(peak, pending.size); void task.finally(() => pending.delete(task));
    }
    await Promise.all(pending);
    const elapsedMs = Math.round(performance.now() - start);
    const stage = { targetRps, scheduled: total, completed: Object.values(statuses).reduce((a, b) => a + b, 0), dropped, errors, peakInFlight: peak, elapsedMs, successfulRps: Number((latencies.length / (elapsedMs / 1000)).toFixed(2)), statuses, ...summary(latencies), routes: paths.map((path, n) => ({ path, requests: byRoute[n].length, ...summary(byRoute[n]) })) };
    stages.push(stage); console.log(JSON.stringify(stage));
    if (errors || dropped || isolationFailure || stage.p95Ms > 5000) break;
    await delay(2000);
  }
  completed = stages.length === 3 && stages.every(stage => stage.errors === 0 && stage.dropped === 0 && stage.p95Ms <= 5000);
} finally {
  for (const account of accounts) {
    try {
      ok(await admin.from('posts').delete().eq('author_id', account.id));
      ok(await admin.auth.admin.deleteUser(account.id));
    } catch { cleanupComplete = false; }
  }
  const report = { at: new Date().toISOString(), completed, cleanupComplete, immediateSignup, accounts: accounts.length, stages, scope: 'Next production build on local Mac + hosted development Supabase; small dataset, paced mixed reads, 90 seconds total; excludes image traffic, Vercel capacity and long-term saturation.' };
  writeFileSync(directory + '/capacity.json', JSON.stringify(report, null, 2));
  assert.ok(cleanupComplete, 'tracked development fixtures need cleanup');
}
assert.ok(completed, 'load acceptance not reached; inspect measured stages');

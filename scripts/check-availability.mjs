// Three bounded reads; no login, mutations, credentials or personal data logged.
import { assertEnvironment } from './environment-guard.mjs';
const env = assertEnvironment(process.env);
if (env.purpose !== 'beta') throw Error('Availability check requires the registered primary environment.');
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const probes = [
  { name: 'application', url: env.appOrigins[0] + '/api/version', options: {}, valid: data => data.environment === env.purpose && /^[a-f0-9]{7,40}$/.test(data.version) },
  { name: 'database', url: env.url + '/rest/v1/rpc/environment_identity', options: { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: '{}' }, valid: data => data.projectRef === env.projectRef && data.purpose === env.purpose },
  { name: 'auth', url: env.url + '/auth/v1/settings', options: { headers: { apikey: key } }, valid: data => data.external?.email === true },
];
const results = await Promise.all(probes.map(async probe => {
  const start = performance.now();
  try {
    const response = await fetch(probe.url, { ...probe.options, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000) });
    const data = await response.json();
    return { service: probe.name, ok: response.ok && probe.valid(data), http: response.status, ms: Math.round(performance.now() - start), ...(probe.name === 'application' ? { version: data.version } : {}) };
  } catch { return { service: probe.name, ok: false, ms: Math.round(performance.now() - start) }; }
}));
console.log(JSON.stringify({ at: new Date().toISOString(), ok: results.every(result => result.ok), results }));
if (results.some(result => !result.ok)) process.exitCode = 1;

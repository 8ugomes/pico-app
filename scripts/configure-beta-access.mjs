// Explicit beta policy; never change passwords, identities, admission or SMTP.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertRemoteIdentity } from './environment-guard.mjs';

process.umask(0o077);
const policy = JSON.parse(readFileSync(new URL('../config/auth-policy.json', import.meta.url), 'utf8'));
const env = await assertRemoteIdentity(process.env, 'migration');
const cwd = resolve('.vercel/beta-access-' + env.purpose);
mkdirSync(cwd + '/supabase', { recursive: true });
writeFileSync(cwd + '/supabase/config.toml', `project_id = "pico-beta-access"
[auth.email]
enable_confirmations = ${policy.emailConfirmationRequired}
`);
function cli(command) {
  const result = spawnSync('npx', ['--yes', 'supabase@2.117.0', 'config', command, '--project-ref', env.projectRef, '--yes'], { cwd, encoding: 'utf8', timeout: 90000, maxBuffer: 4e6 });
  if (result.status !== 0) throw Error('Access configuration failed; provider output withheld.');
  return result.stdout;
}
const changes = (JSON.parse(cli('diff')).changes ?? []).filter(change => change.declared);
if (changes.some(change => change.path.join('.') !== 'auth.email.enable_confirmations')) throw Error('Unexpected configuration change; refused.');
writeFileSync(cwd + '/review.json', JSON.stringify({ projectRef: env.projectRef, changes }, null, 2));
console.log('Reviewed access policy:', env.purpose, changes.map(c => ({ property: c.path.join('.'), from: c.remote, to: c.local })));
if (process.argv.includes('--apply')) {
  cli('push');
  const remaining = (JSON.parse(cli('diff')).changes ?? []).filter(change => change.declared);
  if (remaining.length) throw Error('Applied policy could not be verified.');
  console.log('Access policy applied and verified:', env.purpose);
}

// Only these declared security properties are changed. No SMTP credentials,
// provider settings, existing passwords or email-confirmation policy are altered.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertRemoteIdentity } from './environment-guard.mjs';
const env = await assertRemoteIdentity(process.env, 'migration');
const cwd = resolve('.vercel/auth-security-' + env.purpose);
mkdirSync(cwd + '/supabase', { recursive: true, mode: 0o700 });
writeFileSync(cwd + '/supabase/config.toml', `project_id = "pico-auth-security"
[auth]
minimum_password_length = 12
[auth.email]
secure_password_change = true
double_confirm_changes = true
`, { mode: 0o600 });
function cli(command) {
 const r = spawnSync('npx', ['--yes','supabase@2.117.0','config',command,'--project-ref',env.projectRef,'--yes'], { cwd, encoding:'utf8', timeout:90000, maxBuffer:4e6 });
 if(r.status !== 0) throw Error('Security configuration failed; current configuration was not assumed.');
 return r.stdout;
}
const diff=JSON.parse(cli('diff'));
const changes=(diff.changes ?? []).filter(c=>c.declared);
const allowed=['auth.minimum_password_length','auth.email.secure_password_change','auth.email.double_confirm_changes'];
if(changes.some(c=>!allowed.includes(c.path.join('.'))))throw Error('Unexpected declared configuration change');
writeFileSync(cwd+'/review.json',JSON.stringify({projectRef:env.projectRef,changes},null,2),{mode:0o600});
if(process.argv.includes('--apply')){cli('push');console.log('Password policy applied:',env.purpose);}
else console.log('Password policy reviewed:',env.purpose,changes.map(c=>({property:c.path.join('.'),from:c.remote,to:c.local})));

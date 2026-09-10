import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { assertRemoteIdentity } from './environment-guard.mjs';

const stage = process.argv.includes('--stage');
if (process.argv.slice(2).some(arg => arg !== '--stage')) throw Error('Supported option: --stage');
const git = args => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) throw Error('Git verification failed');
  return result.stdout.trim();
};
const env = { ...process.env, PICO_DEPLOY_TARGET: 'production', PICO_DEPLOY_BRANCH: git(['branch', '--show-current']) };
const expected = await assertRemoteIdentity(env, 'deploy');
if (git(['status', '--porcelain'])) throw Error('Deploy requires a clean main branch');
const sha = git(['rev-parse', 'HEAD']);
if (sha !== git(['rev-parse', 'origin/main'])) throw Error('Fetch origin/main and synchronize before deployment');
const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
if (project.projectId !== expected.deployment.projectId) throw Error('Link the existing pico-app Vercel project before deployment');

const migrations = spawnSync('npx', ['--yes', 'supabase@2.117.0', 'db', 'query', '--workdir', '.vercel/db-beta', '--linked', 'select version from supabase_migrations.schema_migrations order by version'], { encoding: 'utf8', timeout: 60000 });
if (migrations.status !== 0 || readdirSync('supabase/migrations').some(name => !migrations.stdout.includes(name.split('_')[0]))) throw Error('Primary database migrations incomplete');

console.log('Deploy Pico', sha, expected.projectRef, stage ? '(stage before promotion)' : '(primary domain)');
const args = ['--yes', 'vercel@59.14.0', 'deploy', '--yes', '--target=production', ...(stage ? ['--skip-domain'] : []), '--build-env', `PICO_BUILD_VERSION=${sha.slice(0, 12)}`, '--meta', `githubCommitSha=${sha}`, '--meta', 'githubCommitRef=main'];
const result = spawnSync('npx', args, { stdio: 'inherit', env, timeout: 600000 });
if (result.status !== 0) throw Error('Primary deployment failed');

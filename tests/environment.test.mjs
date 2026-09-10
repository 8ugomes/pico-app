import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEnvironment, environments } from '../scripts/environment-guard.mjs';

const dev = { NEXT_PUBLIC_PICO_ENV: 'development', PICO_PROJECT_REF: environments.development.projectRef, NEXT_PUBLIC_SUPABASE_URL: environments.development.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test-key' };
const primary = { ...dev, NEXT_PUBLIC_PICO_ENV: 'beta', PICO_PROJECT_REF: environments.beta.projectRef, NEXT_PUBLIC_SUPABASE_URL: environments.beta.url };

test('environment identity rejects crossed databases and keeps destructive tests in development', () => {
  assert.equal(assertEnvironment(dev, 'seed').purpose, 'development');
  assert.throws(() => assertEnvironment({ ...dev, NEXT_PUBLIC_SUPABASE_URL: environments.beta.url }));
  assert.throws(() => assertEnvironment({ ...dev, PICO_PROJECT_REF: environments.beta.projectRef }));
  for (const action of ['seed', 'hosted-test']) assert.throws(() => assertEnvironment(primary, action));
  assert.throws(() => assertEnvironment({ NEXT_PUBLIC_PICO_ENV: 'production' }));
  assert.throws(() => assertEnvironment({}));
  assert.throws(() => assertEnvironment({ ...dev, NEXT_PUBLIC_PICO_ENV: 'demo' }));
  assert.equal(assertEnvironment({ NEXT_PUBLIC_PICO_ENV: 'demo' }).purpose, 'demo');
});

test('primary publication accepts main and rejects preview, other branches and other projects', () => {
  const env = { ...primary, VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main', VERCEL_PROJECT_ID: environments.beta.deployment.projectId };
  assert.equal(assertEnvironment(env).purpose, 'beta');
  assert.throws(() => assertEnvironment({ ...env, VERCEL_ENV: 'preview', PICO_REVIEW_BRANCH: 'cycle-9-internal' }));
  assert.throws(() => assertEnvironment({ ...env, VERCEL_GIT_COMMIT_REF: 'untrusted', PICO_DEPLOY_BRANCH: 'main' }));
  assert.throws(() => assertEnvironment({ ...env, VERCEL_PROJECT_ID: 'other-project' }));
  assert.throws(() => assertEnvironment({ ...env, VERCEL_GIT_COMMIT_REF: '' }));
  assert.equal(assertEnvironment({ ...env, VERCEL_GIT_COMMIT_REF: '', PICO_DEPLOY_BRANCH: 'main' }).purpose, 'beta');
});

test('deployment requires the primary target and branch while retaining the existing database identity', () => {
  const env = { ...primary, PICO_DEPLOY_TARGET: 'production', PICO_DEPLOY_BRANCH: 'main' };
  assert.equal(assertEnvironment(env, 'deploy').projectRef, environments.beta.projectRef);
  assert.throws(() => assertEnvironment({ ...env, PICO_DEPLOY_TARGET: 'preview' }, 'deploy'));
  assert.throws(() => assertEnvironment({ ...env, PICO_DEPLOY_BRANCH: 'cycle-9-internal' }, 'deploy'));
  assert.throws(() => assertEnvironment(primary, 'deploy'));
  assert.throws(() => assertEnvironment({ ...dev, PICO_DEPLOY_TARGET: 'production', PICO_DEPLOY_BRANCH: 'main' }, 'deploy'));
});

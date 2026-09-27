import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';

import { assertEnvironment } from './environment-guard.mjs';
const expected = assertEnvironment();
const projectRef = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (projectRef !== expected.projectRef || !/^[a-z]{20}$/.test(projectRef)) throw new Error('Link a Supabase project before generating types.');
const ledger = spawnSync('npx', ['--yes', 'supabase@2.117.0', 'db', 'query', '--linked', 'select version from supabase_migrations.schema_migrations order by version'], {
  encoding: 'utf8', timeout: 60_000, maxBuffer: 1024 * 1024,
});
let remoteVersions;
try {
  remoteVersions = new Set(JSON.parse(ledger.stdout).rows.map(row => row.version));
} catch {
  throw new Error('Hosted migration ledger could not be verified; the existing types were preserved.');
}
const localVersions = readdirSync('supabase/migrations').map(name => name.split('_')[0]);
if (ledger.status !== 0 || localVersions.some(version => !remoteVersions.has(version))) {
  throw new Error('Hosted migrations are incomplete; apply them before replacing the canonical database types.');
}
const result = spawnSync('npx', ['--yes', 'supabase@2.117.0', 'gen', 'types', 'typescript', '--project-id', projectRef, '--schema', 'public'], {
  encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024,
});
if (result.status !== 0 || !result.stdout?.includes('export type Database =')) {
  throw new Error('Hosted type generation failed; the existing file was preserved. Check CLI authentication.');
}
const temporary = 'supabase/.temp/generated-database.types.ts';
writeFileSync(temporary, result.stdout);
renameSync(temporary, 'src/types/database.ts');
console.log(`Generated public schema types from hosted project ${projectRef}.`);

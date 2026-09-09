import { spawnSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';

const projectRef = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (!/^[a-z]{20}$/.test(projectRef)) throw new Error('Link a Supabase project before generating types.');
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

// Reviewed public directory data; intentionally separate from destructive development fixtures.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { assertRemoteIdentity } from './environment-guard.mjs';
import { captureContentSnapshot, compareContentSnapshots } from './content-preservation.mjs';
import { arenaCatalog, buildArenaCatalogSql } from './arena-catalog-data.mjs';

const apply = process.argv.includes('--apply');
if (process.argv.slice(2).some(a => a !== '--apply' && a !== '--dry-run')) throw Error('Use --dry-run or --apply');
const env = await assertRemoteIdentity(process.env, 'migration');
const wd = '.vercel/db-' + env.purpose;
if (!existsSync(wd + '/supabase/.temp/project-ref') || readFileSync(wd + '/supabase/.temp/project-ref', 'utf8').trim() !== env.projectRef) throw Error('Run guarded database audit/link first');
const sql = buildArenaCatalogSql();
mkdirSync('.vercel/arena-research', { recursive: true });
writeFileSync('.vercel/arena-research/import.sql', sql);
if (apply) {
  const directory = '.vercel/arena-research/' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + env.purpose;
  const before = await captureContentSnapshot(directory + '/before.json');
  const r = spawnSync('npx', ['--yes', 'supabase@2.117.0', 'db', 'query', '--workdir', wd, '--linked', '--file', resolve('.vercel/arena-research/import.sql')], { encoding: 'utf8', timeout: 60000, env: process.env });
  const after = await captureContentSnapshot(directory + '/after.json');
  const preservation = compareContentSnapshots(before, after);
  writeFileSync(directory + '/report.json', JSON.stringify(preservation, null, 2), { mode: 0o600 });
  console.log('Content preservation:', JSON.stringify(preservation));
  if (!preservation.preserved) throw Error('Import affected content identity; stop and review private receipts');
  if (r.status !== 0) throw Error('Catalog transaction failed; no credentials logged');
  console.log(r.stdout);
}
const receipt = { purpose: env.purpose, projectRef: env.projectRef, applied: apply, arenas: arenaCatalog.arenas.length, sqlSha256: createHash('sha256').update(sql).digest('hex'), checkedAt: new Date().toISOString() };
writeFileSync(`.vercel/arena-research/import-${env.purpose}.json`, JSON.stringify(receipt, null, 2));
console.log(receipt);

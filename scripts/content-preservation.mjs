// Read-only receipts: content stays in Postgres. Never store posts or credentials in Git.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertRemoteIdentity } from './environment-guard.mjs';

const tables = [
  ['posts', 'id', "jsonb_build_array(t.author_id,t.created_at)"],
  ['comments', 'id', "jsonb_build_array(t.author_id,t.post_id,t.created_at)"],
  ['played_games', 'id', "jsonb_build_array(t.player_id,t.created_at)"],
  ['profiles', 'id', "jsonb_build_array(t.id)"],
  ['post_game_context', 'post_id', "jsonb_build_array(t.post_id)"],
  ['media_assets', 'path', "jsonb_build_array(t.player_id,t.bucket,t.path)"],
];
export const snapshotSql = `begin read only;
set local statement_timeout = '30s';
${tables.map(([table,key,identity]) => `select '${table}' as entity, t.${key}::text as key,
  md5((${identity})::text) as identity, md5(row_to_json(t)::text) as digest
  from public.${table} t`).join('\nunion all\n')} order by entity,key;
commit;`;

export function compareContentSnapshots(before, after) {
  if (before.format !== 1 || after.format !== 1 || before.projectRef !== after.projectRef) throw Error('Content inventory identity mismatch');
  const index = rows => {
    const values=new Map();
    for(const row of rows) {
      if (!tables.some(([name])=>name===row.entity) || !row.key || !row.identity || !row.digest) throw Error('Invalid content inventory row');
      const key=row.entity+'\0'+row.key;
      if(values.has(key)) throw Error('Duplicate content inventory row');
      values.set(key,row);
    }
    return values;
  };
  const previous=index(before.rows), current=index(after.rows);
  let missing=0,identityChanged=0,edited=0;
  for(const [key,row] of previous) {
    const next=current.get(key);
    if(!next) missing++;
    else { if(next.identity!==row.identity) identityChanged++; if(next.digest!==row.digest) edited++; }
  }
  return { preserved:missing===0 && identityChanged===0, before:previous.size, after:current.size,
    missing, identityChanged, edited, added:[...current.keys()].filter(key=>!previous.has(key)).length };
}

export async function captureContentSnapshot(output, env=process.env) {
  const expected=await assertRemoteIdentity(env,'backup');
  const workdir=resolve('.vercel/db-'+expected.purpose);
  if(readFileSync(workdir+'/supabase/.temp/project-ref','utf8').trim()!==expected.projectRef) throw Error('Linked database identity mismatch');
  const result=spawnSync('npx',['--yes','supabase@2.117.0','db','query','--workdir',workdir,'--linked',snapshotSql],{
    env,encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024,
  });
  if(result.status!==0) throw Error('Read-only content inventory failed; release stopped');
  let rows;
  try { rows=JSON.parse(result.stdout).rows; } catch { throw Error('Invalid content inventory response'); }
  if(!Array.isArray(rows)) throw Error('Missing content inventory rows');
  const snapshot={format:1,projectRef:expected.projectRef,createdAt:new Date().toISOString(),rows};
  compareContentSnapshots(snapshot,snapshot);
  // Only write in the ignored operational area. The receipt contains IDs and hashes, not content.
  const destination=resolve(output), allowed=resolve('.vercel')+'/';
  if(!destination.startsWith(allowed)) throw Error('Content receipts must stay inside .vercel');
  mkdirSync(dirname(destination),{recursive:true,mode:0o700});
  writeFileSync(destination,JSON.stringify(snapshot,null,2),{mode:0o600});
  return snapshot;
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [action,first,second,...extra]=process.argv.slice(2);
  if(extra.length || !first || !['capture','compare'].includes(action) || (action==='capture' && second) || (action==='compare' && !second)) throw Error('Use capture .vercel/file.json or compare before.json after.json');
  if(action==='capture') {
    const snapshot=await captureContentSnapshot(first);
    console.log(JSON.stringify({projectRef:snapshot.projectRef,rows:snapshot.rows.length,saved:true}));
  } else {
    const report=compareContentSnapshots(JSON.parse(readFileSync(first,'utf8')),JSON.parse(readFileSync(second,'utf8')));
    console.log(JSON.stringify(report));
    if(!report.preserved) throw Error('Content disappeared or changed identity; review the private receipts before continuing. Never restore over newer user data.');
  }
}

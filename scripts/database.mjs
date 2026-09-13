import{spawnSync}from'node:child_process';import{mkdirSync,copyFileSync,readdirSync,readFileSync,writeFileSync}from'node:fs';import{assertRemoteIdentity}from'./environment-guard.mjs';
import{captureContentSnapshot,compareContentSnapshots}from'./content-preservation.mjs';
const action=process.argv[2];if(!['migrate','dry-run','seed','audit'].includes(action))throw Error('Use migrate, dry-run, seed or audit');
const expected=await assertRemoteIdentity(process.env,action==='seed'?'seed':'migration');
const wd='.vercel/db-'+expected.purpose;mkdirSync(wd+'/supabase/migrations',{recursive:true});copyFileSync('supabase/config.toml',wd+'/supabase/config.toml');for(const f of readdirSync('supabase/migrations'))copyFileSync('supabase/migrations/'+f,wd+'/supabase/migrations/'+f);
function cli(args){const r=spawnSync('npx',['--yes','supabase@2.117.0',...args,'--workdir',wd],{encoding:'utf8',env:process.env,timeout:120000,maxBuffer:4*1024*1024});if(r.status!==0)throw Error('Supabase operation failed; no credentials logged');return r.stdout;}
cli(['link','--project-ref',expected.projectRef]);
if(action==='seed')cli(['db','query','--linked',readFileSync('supabase/seed.sql','utf8')]);
else if(action==='audit')console.log(cli(['migration','list','--linked']));
else{
 console.log(cli(['db','push','--linked','--dry-run','--skip-vault']));
 if(action==='migrate'){
  const directory='.vercel/content-preservation/'+new Date().toISOString().replace(/[:.]/g,'-')+'-migration';
  const before=await captureContentSnapshot(directory+'/before.json');
  try{console.log(cli(['db','push','--linked','--skip-vault']));}
  finally{
   const after=await captureContentSnapshot(directory+'/after.json');
   const report=compareContentSnapshots(before,after);
   writeFileSync(directory+'/report.json',JSON.stringify(report,null,2),{mode:0o600});
   console.log('Content preservation:',JSON.stringify(report));
   if(!report.preserved)throw Error('Migration changed content identity or removed rows; stop release and review private receipts. Never overwrite newer user data.');
  }
 }
}
console.log('Validated destination:',expected.purpose,expected.projectRef,action);

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export const environments=JSON.parse(readFileSync(new URL('../config/environments.json',import.meta.url),'utf8'));
export function assertEnvironment(env=process.env, action='build') {
  const purpose=env.NEXT_PUBLIC_PICO_ENV;
  if(purpose==='demo') {
    if(['migration','seed','hosted-test','deploy','bootstrap','backup'].includes(action) || env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_SECRET_KEY) throw Error('Demo cannot access a backend');
    return {purpose:'demo'};
  }
  const expected=environments[purpose];
  if(!expected?.provisioned || !expected.url || env.NEXT_PUBLIC_SUPABASE_URL!==expected.url || env.PICO_PROJECT_REF!==expected.projectRef || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) throw Error('Environment identity mismatch; operation refused');
  if(env.PICO_ENV && env.PICO_ENV!==purpose) throw Error('Server/client environment mismatch');
  if(purpose==='production') throw Error('Production is not authorized in this cycle');
  if(['seed','hosted-test'].includes(action) && purpose!=='development') throw Error('Destructive test/seed requires exclusive development');
  if(env.VERCEL_ENV==='preview' && purpose==='beta' && (env.VERCEL_GIT_COMMIT_REF || env.PICO_REVIEW_BRANCH)!=='cycle-9-internal') throw Error('Beta credentials are restricted to the review branch');
  if(action==='deploy' && (purpose!=='beta' || env.PICO_DEPLOY_TARGET!=='preview')) throw Error('Only internal preview deploy is authorized');
  return {purpose,...expected};
}
export async function assertRemoteIdentity(env=process.env,action='migration') {
  const expected=assertEnvironment(env,action);
  const r=await fetch(expected.url+'/rest/v1/rpc/environment_identity',{method:'POST',headers:{apikey:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:'{}'});
  const identity=await r.json();
  if(!r.ok || identity?.purpose!==expected.purpose || identity?.projectRef!==expected.projectRef) throw Error('Remote identity mismatch; operation refused');
  return expected;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){assertEnvironment(process.env,process.argv[2]||'build');console.log('Environment verified');}

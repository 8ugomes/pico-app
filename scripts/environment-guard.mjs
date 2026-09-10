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
  if(['seed','hosted-test'].includes(action) && purpose!=='development') throw Error('Destructive test/seed requires exclusive development');
  const deployment=expected.deployment;
  if(env.VERCEL_ENV && env.VERCEL_ENV!=='development') {
    if(!deployment || env.VERCEL_ENV!==deployment.target) throw Error('Connected builds require the primary deployment target');
    if((env.VERCEL_GIT_COMMIT_REF || env.PICO_DEPLOY_BRANCH)!==deployment.branch) throw Error('Connected builds require the main branch');
    if(env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID!==deployment.projectId) throw Error('Vercel project mismatch');
  }
  if(action==='deploy' && (!deployment || env.PICO_DEPLOY_TARGET!==deployment.target || env.PICO_DEPLOY_BRANCH!==deployment.branch)) throw Error('Deploy requires the primary project, production target and main branch');
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

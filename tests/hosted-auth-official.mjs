// Real Auth/Postgres/Next HTTP in exclusive development. No external email sends.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env,'hosted-test');
process.umask(0o077);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,origin='http://localhost:3002';
const opts={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,opts),anonymous=createClient(url,key,opts),users=[],results=[];
const check=(value,label)=>{assert.ok(value,label);results.push(label)};
function ok(r,label){check(!r.error,label);return r.data;}
function session(){const jar=new Map();return {jar,client:createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:xs=>xs.forEach(x=>x.value?jar.set(x.name,x.value):jar.delete(x.name))}})};}
function sql(q){const r=spawnSync('npx',['--yes','supabase@2.117.0','db','query','--linked',q],{encoding:'utf8',timeout:60000});if(r.status)throw Error('Controlled audit SQL failed');return r.stdout;}
async function http(a,path,body,status=200,requestOrigin=origin){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:requestOrigin,'Content-Type':'application/json',Cookie:a?[...a.jar].map(([k,v])=>k+'='+v).join('; '):''},body:body?JSON.stringify(body):undefined,redirect:'manual'});check(r.status===status,path+' '+status);check(/no-store/.test(r.headers.get('cache-control')||''),'private response '+path);for(const h of r.headers.getSetCookie()){const p=h.split(';')[0],i=p.indexOf('=');if(a)a.jar.set(p.slice(0,i),p.slice(i+1));}return r;}
async function api(a,path,body,status,from){return(await http(a,path,body,status,from)).json();}
async function signup(label){const email='pico-auth-'+randomBytes(6).toString('hex')+'@example.com',password=randomBytes(18).toString('base64url')+'aA9!',a=session();const d=ok(await a.client.auth.signUp({email,password,options:{data:{display_name:'Teste de acesso '+label,role:'admin',onboarding_completed:true}}}),'signup without invitation');check(d.session&&d.user,'real session');const u={...a,id:d.user.id,email,password};users.push(u);writeFileSync('.vercel/auth-official-fixture.json',JSON.stringify(users.map(({id,email})=>({id,email}))),{mode:0o600});return u;}
let completed=false;
try {
 const weak=await anonymous.auth.signUp({email:'pico-weak-'+randomBytes(6).toString('hex')+'@example.com',password:'12345678901'});
 check(weak.error?.code==='weak_password','server enforces minimum 12 characters');
 const a=await signup('A'),b=await signup('B');
 const access=(await api(a,'/api/access'));check(access.admitted===true&&access.role===null,'immediate access without metadata privilege');
 check((await api(a,'/api/welcome',{action:'check'})).data===null,'incomplete profile is not enrolled');
 const sports=ok(await a.client.from('sports').select('id'),'read sports');
 const profile={action:'save_profile',name:'Teste de acesso A',username:'auth_'+a.id.replaceAll('-','').slice(0,12),bio:'',city:'',neighborhood:'',sportId:sports[0].id,level:'Iniciante',available:false};
 await api(a,'/api/social/mutate',profile);
 await Promise.all([api(a,'/api/welcome',{action:'check'}),api(a,'/api/welcome',{action:'check'})]);
 const welcome=(await api(a,'/api/welcome',{action:'check'})).data;check(welcome.pending===true,'enrollment notice persists');
 const own=ok(await a.client.from('community_members').select('community_id,status').eq('player_id',a.id),'memberships');check(own.filter(m=>m.community_id===welcome.id).length===1,'concurrent enrollment unique');
 await api(b,'/api/welcome',{action:'acknowledge',playerId:a.id},400);check((await api(a,'/api/welcome',{action:'check'})).data.pending,'another account cannot acknowledge');
 await api(a,'/api/welcome',{action:'acknowledge'},403,'https://untrusted.example');
 check((await api(a,'/api/welcome',{action:'check'})).data.pending,'CSRF cannot dismiss');
 await api(a,'/api/welcome',{action:'acknowledge'});check(!(await api(a,'/api/welcome',{action:'check'})).data.pending,'acknowledgment is persisted');
 const page=ok(await a.client.rpc('community_page',{p_slug:'pico-oficial'}),'official page');check(page.editorial.length===3&&page.pico_official,'institutional content');check(page.members.some(m=>m.id===a.id),'real member listed');
 await api(a,'/api/communities',{action:'membership',id:welcome.id,memberAction:'leave'});await api(a,'/api/social/mutate',{...profile,sportId:sports[1].id});check((await api(a,'/api/welcome',{action:'check'})).data===null,'sport changes do not rejoin');
 check(Boolean((await a.client.from('profiles').select('email')).error),'email not in social profile schema');
 check(Boolean((await a.client.schema('auth').from('users').select('email,encrypted_password')).error),'Auth schema not exposed');
 check(Boolean((await a.client.auth.admin.listUsers()).error),'ordinary user cannot list Auth accounts');
 const anonProfiles=await anonymous.from('profiles').select('id');check(anonProfiles.error?.code==='42501'||anonProfiles.data?.length===0,'no social data without login');
 await api(null,'/api/access',undefined,401);await api(null,'/api/welcome',{action:'check'},401);
 const badExisting=await anonymous.auth.signInWithPassword({email:a.email,password:'wrong-password-here'}),badUnknown=await anonymous.auth.signInWithPassword({email:'missing-'+randomBytes(6).toString('hex')+'@example.com',password:'wrong-password-here'});
 check(badExisting.error?.code==='invalid_credentials'&&badUnknown.error?.code===badExisting.error.code,'invalid login does not distinguish email existence');
 const otherDevice=session();ok(await otherDevice.client.auth.signInWithPassword({email:a.email,password:a.password}),'second device login');
 const previous=ok(await otherDevice.client.auth.getSession(),'capture test refresh token').session;
 const recovery=ok(await admin.auth.admin.generateLink({type:'recovery',email:a.email}),'generate recovery link without sending email');
 const reset=session();await api(reset,'/api/auth/confirm',{type:'recovery',token_hash:recovery.properties.hashed_token});
 const newPassword=randomBytes(20).toString('base64url')+'A9!';
 ok(await reset.client.auth.updateUser({password:newPassword}),'password reset using verified recovery session');
 ok(await reset.client.auth.signOut(),'logout all sessions after reset');
 check(Boolean((await otherDevice.client.auth.refreshSession({refresh_token:previous.refresh_token})).error),'previous device cannot renew after reset/logout');
 check((await anonymous.auth.signInWithPassword({email:a.email,password:a.password})).error?.code==='invalid_credentials','old password rejected');
 ok(await anonymous.auth.signInWithPassword({email:a.email,password:newPassword}),'new password works');await anonymous.auth.signOut();
 await api(session(),'/api/auth/confirm',{type:'recovery',token_hash:recovery.properties.hashed_token},400);
 await api(session(),'/api/auth/confirm',{type:'recovery',token_hash:'invalid'},400);
 await api(session(),'/api/auth/confirm',{type:'recovery',token_hash:recovery.properties.hashed_token},403,'https://untrusted.example');
 const email='pico-confirm-'+randomBytes(6).toString('hex')+'@example.com',password=randomBytes(20).toString('base64url')+'A9!';
 const unconfirmed=ok(await admin.auth.admin.createUser({email,password,email_confirm:false}),'create controlled unconfirmed identity');users.push({id:unconfirmed.user.id,email});
 check((await anonymous.auth.signInWithPassword({email,password})).error?.code==='email_not_confirmed','unconfirmed email cannot login');
 const link=ok(await admin.auth.admin.generateLink({type:'signup',email,password}),'generate confirmation without sending email');
 const confirmed=session();await api(confirmed,'/api/auth/confirm',{type:'email',token_hash:link.properties.hashed_token});
 check((await api(confirmed,'/api/access')).admitted===true,'email confirmation unlocks immediate access');
 await api(session(),'/api/auth/confirm',{type:'email',token_hash:link.properties.hashed_token},400);
 sql(`update pico_private.beta_admissions set status='suspended' where player_id='${b.id}'`);
 check((await api(b,'/api/access')).admitted===false,'suspension applies to existing cookies');await api(b,'/api/welcome',{action:'check'},403);
 const audit=sql(`select count(*)::int accounts, bool_and(encrypted_password like '$2%') bcrypt_only, count(*) filter(where encrypted_password='')::int empty_hashes from auth.users where id in (${users.map(u=>"'"+u.id+"'").join(',')})`);
 // Only aggregate metadata leaves SQL; no email/password/hash values are printed.
 check(/bcrypt_only/.test(audit)&&/true/.test(audit),'stored test credentials are bcrypt hashes');
 writeFileSync('.vercel/auth-password-storage-audit.json',audit,{mode:0o600});
 completed=true;
} finally {
 for(const u of users)ok(await admin.auth.admin.deleteUser(u.id),'tracked test identity removed');
 writeFileSync('.vercel/auth-official-results.json',JSON.stringify({completed,checks:results.length,results,emailDeliveryTested:false,productionMutated:false},null,2));
 console.log('Auth/official hosted checks:',results.length,'completed:',completed,'fixtures cleaned:',users.length);
}

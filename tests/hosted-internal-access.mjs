import{createClient}from'@supabase/supabase-js';import{randomBytes}from'node:crypto';import{spawnSync}from'node:child_process';import assert from'node:assert/strict';import{assertRemoteIdentity}from'../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env,'hosted-test');
const ref=process.env.PICO_PROJECT_REF,url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const opts={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,opts);const tracked=[],inviteEmails=[];
function sql(query){const r=spawnSync('npx',['--yes','supabase@2.117.0','db','query','--linked',query],{env:process.env,encoding:'utf8',timeout:60000});if(r.status!==0)throw Error('Controlled development SQL failed');return r.stdout;}
try{
 const blocked=createClient(url,key,opts);const denied=await blocked.auth.signUp({email:`pico-uninvited-${randomBytes(6).toString('hex')}@example.com`,password:randomBytes(24).toString('base64url')});if(denied.data.user)tracked.push(denied.data.user.id);assert.ok(denied.error,'direct signup must reject uninvited email');
 const users=[];for(let i=0;i<2;i++){const email=`pico-c9-${randomBytes(8).toString('hex')}@example.com`,password=randomBytes(24).toString('base64url');inviteEmails.push(email);sql(`insert into pico_private.invitations(kind,email,token_hash,expires_at) values('beta','${email}','${randomBytes(32).toString('hex')}',now()+interval '1 hour')`);const client=createClient(url,key,opts);const r=await client.auth.signUp({email,password});assert.equal(r.error,null);assert.ok(r.data.user);tracked.push(r.data.user.id);users.push({id:r.data.user.id,client,email});}
 for(const u of users){const r=await u.client.from('profiles').select('id');assert.equal(r.error,null);assert.equal(r.data.length,0);}
 const boot=await admin.rpc('bootstrap_operator',{p_uid:users[0].id});assert.equal(boot.error,null);
 assert.equal((await users[0].client.rpc('beta_status')).data.admitted,true);assert.equal((await users[0].client.from('arenas').select('id')).data.length,3);
 assert.ok((await users[1].client.rpc('bootstrap_operator',{p_uid:users[1].id})).error);
 sql(`update pico_private.beta_admissions set status='revoked' where player_id='${users[0].id}'`);
 assert.equal((await users[0].client.from('arenas').select('id')).data.length,0);assert.equal((await users[0].client.rpc('beta_status')).data.admitted,false);
 console.log('Hosted internal access: direct signup denied, 2 invited signups, admission, denied bootstrap and old-JWT revocation PASS',ref);
}finally{for(const id of tracked){const r=await admin.auth.admin.deleteUser(id);if(r.error)throw Error('Tracked user cleanup failed')}for(const email of inviteEmails)sql(`delete from pico_private.invitations where email='${email}' and kind='beta'`);console.log('Controlled identities cleaned');}

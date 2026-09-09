import{createClient}from'@supabase/supabase-js';import{assertRemoteIdentity}from'./environment-guard.mjs';
await assertRemoteIdentity(process.env,'bootstrap');const uid=process.env.PICO_BOOTSTRAP_UID;
if(!/^[0-9a-f-]{36}$/.test(uid??''))throw Error('Set the verified responsible UID in protected environment storage first');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});const u=await c.auth.admin.getUserById(uid);if(u.error||u.data.user.id!==uid||!u.data.user.email_confirmed_at)throw Error('Responsible identity is not verified');const r=await c.rpc('bootstrap_operator',{p_uid:uid});if(r.error)throw Error('Bootstrap refused');console.log('Verified operator bootstrap completed');

// Run --before, apply the reviewed migration in development, then run --after.
// Reuses only the disposable accounts created by hosted-comment-actions.mjs --keep.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
const environment=await assertRemoteIdentity(process.env,'hosted-test');
process.umask(0o077);
const output='.vercel/social-review',origin='http://localhost:3002';
const fixture=JSON.parse(readFileSync(output+'/fixtures.json','utf8'));
assert.equal(fixture.projectRef,environment.projectRef);
assert.equal(fixture.users.length,2);
const phase=process.argv[2];assert.ok(['--before','--after'].includes(phase));
const admin=createClient(environment.url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;};
const ok=(result,label)=>{check(!result.error,label);return result.data;};
for(const user of fixture.users) {
  const identity=ok(await admin.auth.admin.getUserById(user.id),'fixture identity').user;
  check(identity.email===user.email && /^pico-comment-[a-f0-9]+@example\.com$/.test(identity.email),'disposable account only');
}
const original=ok(await admin.from('posts').select('*').eq('id',fixture.post).single(),'fixture post');
check(original.author_id===fixture.users[0].id,'fixture author');
if(phase==='--before') {
  ok(await admin.from('posts').update({arena_id:'20000000-0000-4000-8000-000000000001'}).eq('id',fixture.post).eq('author_id',fixture.users[0].id),'attach fixture to retired demo');
}
const post=ok(await admin.from('posts').select('*').eq('id',fixture.post).single(),'original still stored');
const comments=ok(await admin.from('comments').select('*').eq('post_id',fixture.post).order('id'),'stored comments');
if(phase==='--before') writeFileSync(output+'/history-before.json',JSON.stringify({post,comments}));
else {
  const before=JSON.parse(readFileSync(output+'/history-before.json','utf8'));
  assert.deepEqual(post,before.post);checks++;
  assert.deepEqual(comments,before.comments);checks++;
}
for(const user of fixture.users) {
  const jar=new Map();
  const client=createServerClient(environment.url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
  ok(await client.auth.signInWithPassword({email:user.email,password:user.password}),'fixture authentication');
  const posts=ok(await client.rpc('read_repost_feed',{p_post:fixture.post}),'RLS feed read');
  check(posts.length===(phase==='--before'?0:1),'visibility across migration');
  if(phase==='--after') {
    check(posts[0].id===fixture.post && posts[0].body===post.body && posts[0].arena_id===null,'same original without fictitious arena link');
    check(posts[0].comment_count===2,'comment history retained');
    const response=await fetch(origin+'/api/posts?post='+fixture.post,{headers:{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')},signal:AbortSignal.timeout(20000)});
    check(response.status===200,'existing application HTTP remains compatible');
    check(/no-store/.test(response.headers.get('cache-control')),'private response');
    const payload=await response.json();
    check(JSON.stringify(payload).includes(fixture.post),'existing app returns preserved post');
  }
  await client.auth.signOut({scope:'local'});
}
writeFileSync(output+'/history-'+phase.slice(2)+'-result.json',JSON.stringify({passed:true,phase,checks,projectRef:environment.projectRef,productionMutated:false,at:new Date().toISOString()},null,2));
console.log(JSON.stringify({passed:true,phase,checks}));

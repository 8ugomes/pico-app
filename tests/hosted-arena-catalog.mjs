import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import sharp from 'sharp';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
import { arenaCatalog } from '../scripts/arena-catalog-data.mjs';

process.umask(0o077);
const env = await assertRemoteIdentity(process.env, 'hosted-test');
const origin = 'http://localhost:3002';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (u,o) => fetch(u,{...o,signal:AbortSignal.timeout(25000)}) } };
const admin = createClient(env.url,process.env.SUPABASE_SECRET_KEY,options);
const fixturePath = '.vercel/arena-research/hosted-fixture.json';
let checks = 0;
const fixture = { projectRef:env.projectRef, users:[], photos:[], communities:[] };
const save = () => writeFileSync(fixturePath,JSON.stringify(fixture,null,2));
function ok(r,label) { assert.ok(!r.error, label+': '+r.error?.code); checks++; return r.data; }
function check(value,label) { assert.ok(value,label); checks++; }
function sql(query) { const r=spawnSync('npx',['--yes','supabase@2.117.0','db','query','--workdir','.vercel/db-development','--linked',query],{encoding:'utf8',timeout:60000,env:process.env}); if(r.status!==0)throw Error('Fixture SQL failed'); }
async function cleanup(saved=fixture) {
  check(saved.projectRef===env.projectRef,'cleanup identity');
  for(const id of saved.communities) sql(`delete from public.communities where id='${id}'::uuid`);
  for(const p of saved.photos) ok(await admin.storage.from('avatars').remove([p]),'remove fixture photo');
  for(const u of saved.users) { ok(await admin.auth.admin.deleteUser(u.id),'delete fixture account'); }
  // Deleting the test owner puts the existing directory arena in custody; restore only its original null-owner state.
  if(saved.claimedArena) ok(await admin.from('arenas').update({status:'active'}).eq('id',saved.claimedArena).is('owner_id',null),'restore development catalog status');
  writeFileSync('.vercel/arena-research/hosted-cleanup.json',JSON.stringify({projectRef:env.projectRef,users:saved.users.length,completed:true}));
}
if(process.argv.includes('--cleanup')) { await cleanup(JSON.parse(readFileSync(fixturePath,'utf8'))); process.exit(0); }
async function user(label) {
  const email=`pico-arena-${label}-${randomBytes(5).toString('hex')}@example.com`;
  const password=label==='viewer'&&process.env.PICO_ARENA_UI_PASSWORD || randomBytes(24).toString('base64url')+'9aA!';
  const {user}=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Revisão de arenas '+label}}),'create isolated identity');
  fixture.users.push({id:user.id,email,password,label});save();
  const jar=new Map();
  const client=createServerClient(env.url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>value?jar.set(name,value):jar.delete(name))}});
  ok(await client.auth.signInWithPassword({email,password}),'real login');
  return {id:user.id,email,password,client,jar};
}
async function http(user,path,body,status=200,contentType='application/json') {
  const r=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(user?{Cookie:[...user.jar].map(([k,v])=>k+'='+v).join('; ')}:{}),...(body!==undefined?{'Content-Type':contentType}:{})},body:body===undefined?undefined:contentType==='application/json'?JSON.stringify(body):body,signal:AbortSignal.timeout(25000)});
  check(r.status===status,`${path.split('?')[0]} expected ${status}, got ${r.status}`);
  check(/no-store/.test(r.headers.get('cache-control')||''),'private responses');
  const json=await r.json();return json.data??json;
}
let success=false;
try {
  const viewer=await user('viewer'),operator=await user('operator');
  const anonymous=await http(null,'/api/social/read?resource=arenas');
  check(anonymous.arenas.length===0&&anonymous.sports.length===0,'anonymous cannot read social catalog');
  const list=await http(viewer,'/api/social/read?resource=arenas');
  check(list.arenas.length===17&&!list.hasMore,'17 real arenas on first page');
  check(list.arenas.every(a=>!a.isDemo&&a.directory?.photos.length&&a.image),'real images and provenance');
  for(const a of list.arenas) {
    const r=await fetch(origin+a.image,{signal:AbortSignal.timeout(10000)});
    check(r.ok&&r.headers.get('content-type')?.includes('image/webp'),'cover served '+a.slug);
  }
  const arena=arenaCatalog.arenas[0];
  const before=ok(await admin.from('arenas').select('owner_id,status').eq('id',arena.id).single(),'original ownership');
  check(before.owner_id===null&&before.status==='active','unclaimed development arena');
  await http(viewer,'/api/arenas',{action:'follow',id:arena.id,join:true});
  await http(viewer,'/api/arenas',{action:'follow',id:arena.id,join:true});
  check((await http(viewer,'/api/arenas?slug='+arena.slug)).membership==='active','follow persisted');
  check(ok(await viewer.client.from('arena_members').select('arena_id').eq('arena_id',arena.id).eq('player_id',viewer.id),'own follows').length===1,'follow deduplicated');
  await http(viewer,'/api/communities',{action:'official',arena:arena.id},403);
  const request=await http(viewer,'/api/arenas',{action:'request',kind:'claim',id:arena.id,data:{name:arena.name,city:arena.city,neighborhood:arena.neighborhood,details:'Fixture isolada de aprovação de responsável.'}});
  check((await http(viewer,'/api/arenas?slug='+arena.slug)).owner===null,'request does not grant ownership');
  await http(viewer,'/api/arenas',{action:'review',id:request,approve:true},403);
  ok(await admin.rpc('bootstrap_operator',{p_uid:operator.id}),'scoped operator');
  fixture.claimedArena=arena.id;save();
  await http(operator,'/api/arenas',{action:'review',id:request,approve:true});
  check((await http(viewer,'/api/arenas?slug='+arena.slug)).rank===40,'approved owner');
  const official=await http(viewer,'/api/communities',{action:'official',arena:arena.id});
  fixture.communities.push(official);save();
  check(await http(viewer,'/api/communities',{action:'official',arena:arena.id})===official,'one official community');
  const links=await http(viewer,'/api/communities?arena='+arena.id+'&mine=false');
  check(links.some(c=>c.id===official&&c.is_official),'official community visible on the correct arena');
  const bytes=await sharp({create:{width:256,height:256,channels:3,background:'#CBBBE0'}}).png().toBuffer();
  const uploaded=await http(viewer,'/api/media?bucket=avatars',bytes,200,'image/png');fixture.photos.push(uploaded.path);save();
  await http(viewer,'/api/social/mutate',{action:'set_avatar',path:uploaded.path});
  const sport=ok(await viewer.client.from('sports').select('id').eq('slug','futevolei').single(),'sport');
  ok(await viewer.client.from('profiles').update({display_name:'Revisão de arenas',username:'revisao_'+viewer.id.replaceAll('-','').slice(0,12),onboarding_completed:true}).eq('id',viewer.id),'fixture profile');
  ok(await viewer.client.from('player_sports').insert({player_id:viewer.id,sport_id:sport.id,is_primary:true}),'fixture sport');
  ok(await viewer.client.rpc('ensure_pico_membership'),'official membership');
  const page=ok(await viewer.client.rpc('community_page',{p_slug:'pico-oficial'}),'editorial page');
  check(page.editorial.length===1&&page.editorial[0].title==='Qual arena vale conhecer?','single concise editorial');
  writeFileSync('docs/arena-catalog-review/hosted.json',JSON.stringify({checks,passed:true,projectRef:env.projectRef,origin,arenas:17,scenarios:['anonymous denied','all covers served','follow persisted and deduplicated','claim requires operator review','one official community after approval','concise institutional editorial'],completedAt:new Date().toISOString()},null,2));
  success=true;console.log('Hosted arena catalog PASS:',checks,'checks');
} finally { if(!success||!process.argv.includes('--keep')) await cleanup(); else console.log('Isolated viewer retained for browser review; credentials stay in ignored fixture.'); }

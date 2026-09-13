// Two disposable development accounts, real Auth/RPC/API/Storage and browser search.
// node --env-file=.env.local --env-file=.env.hosted-admin tests/hosted-search.mjs
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env,'hosted-test');process.umask(0o077);
const origin=process.env.SEARCH_BASE_URL || 'http://localhost:3037';assert.equal(new URL(origin).hostname,'localhost');
const output=process.env.PICO_REVIEW_DIR || '.vercel/search-review';mkdirSync(output,{recursive:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[],groups=[],checks=[];let browser,completed=false;
const check=(value,label)=>{assert.ok(value,label);checks.push(label)};
function ok(result,label){check(!result.error,label+(result.error?': '+result.error.code:''));return result.data;}
const cookie=user=>[...user.jar].map(([k,v])=>k+'='+v).join('; ');
async function api(user,path,body,status=200){
  const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{Cookie:user?cookie(user):'',Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  check(r.status===status,'HTTP '+status+' '+path.split('?')[0]);check(/no-store/.test(r.headers.get('cache-control')),'private response');
  for(const h of r.headers.getSetCookie()){const part=h.split(';')[0],i=part.indexOf('=');if(user)user.jar.set(part.slice(0,i),part.slice(i+1));}
  return r.json();
}
async function account(label){
  const email='pico-search-'+randomBytes(9).toString('hex')+'@example.com',password=randomBytes(24).toString('base64url')+'Aa9!';
  const created=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create controlled account');
  const jar=new Map(),client=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:entries=>entries.forEach(e=>e.value?jar.set(e.name,e.value):jar.delete(e.name))}});
  const user={id:created.user.id,jar,client,username:'bs_'+created.user.id.replaceAll('-','').slice(0,15)};users.push(user);
  writeFileSync(output+'/fixtures.json',JSON.stringify({projectRef:process.env.PICO_PROJECT_REF,users:users.map(u=>u.id),groups}));
  ok(await client.auth.signInWithPassword({email,password}),'real login');
  const sports=(await api(user,'/api/social/read?resource=sports')).data.sports;
  const photo=await sharp({create:{width:80,height:80,channels:3,background:'#CBBBE0'}}).png().toBuffer();
  const upload=await fetch(origin+'/api/media?bucket=avatars',{method:'POST',headers:{Cookie:cookie(user),Origin:origin,'Content-Type':'image/png'},body:photo,signal:AbortSignal.timeout(20000)});
  check(upload.ok,'controlled private avatar');const media=await upload.json();
  await api(user,'/api/social/mutate',{action:'set_avatar',path:media.data.path});
  await api(user,'/api/social/mutate',{action:'save_profile',name:label,username:user.username,bio:'Conta temporária de teste da busca.',city:'São Paulo',neighborhood:'',sportId:sports[0].id,level:'Iniciante',available:false});
  return user;
}
const search=async(user,term)=>(await api(user,'/api/social/read?resource=discover&search='+encodeURIComponent(term))).data.players;
try {
  const a=await account('Pessoa de teste Busca'),b=await account('João Açúcar Busca');
  check((await search(a,'@'+b.username.toUpperCase())).some(p=>p.id===b.id),'remote @username matching');
  check((await search(a,'joao acucar busca')).some(p=>p.id===b.id),'remote accent-insensitive display name');
  check(!(await search(a,'@'+a.username)).length,'self is excluded');
  check(!(await search(a,b.username+'%')).length,'wildcard symbols remain literal');
  await api(a,'/api/social/read?resource=discover&search='+('x'.repeat(101)),null,400);
  await api(null,'/api/social/read?resource=discover&search=joao',null,401);
  await api(a,'/api/communities?offset=NaN',null,400);
  await api(null,'/api/communities?search=joao',null,401);
  const group=(await api(b,'/api/communities',{action:'create',data:{name:'Vôlei São João '+b.username,description:'Conteúdo restrito de teste',rules:'Regra restrita',sports:[],visibility:'private',entry_mode:'approval'}})).data;groups.push(group.id);
  const directory=(await api(a,'/api/communities?search='+encodeURIComponent('volei sao joao '+b.username))).data;
  check(directory.length===1 && directory[0].id===group.id,'remote community name search');
  check(directory[0].description===null && !('members' in directory[0]),'private data absent from directory');
  check((await api(a,'/api/communities?mine=true&search='+b.username)).data.length===0,'mine scope excludes groups not joined');
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.addCookies([...a.jar].map(([name,value])=>({name,value,url:origin,sameSite:'Lax'})));
  await context.addInitScript(()=>localStorage.setItem('pico.install-dismissed','1'));
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/descobrir');const input=page.getByRole('searchbox',{name:'Buscar pessoas por nome ou usuário'});await input.fill('@'+b.username);
  await page.locator(`.person-row a[href="/perfil/${b.username}"]`).waitFor();
  await page.screenshot({path:output+'/hosted-people-390.png',fullPage:true});
  await page.locator(`.person-row a[href="/perfil/${b.username}"]`).click();await page.locator('.public-player-identity').waitFor();checks.push('real browser search opens authorized profile');
  await page.goto(origin+'/comunidades');await page.getByRole('searchbox',{name:'Buscar comunidades',exact:true}).fill('volei sao joao '+b.username);
  await page.locator(`a[href="/comunidades/${group.slug}"]`).waitFor();await page.locator(`a[href="/comunidades/${group.slug}"]`).click();
  await page.getByRole('heading',{name:'Um espaço reservado ao grupo'}).waitFor();
  check(!(await page.locator('body').innerText()).includes('Conteúdo restrito de teste'),'opening private search result still protects content');
  check(errors.length===0,'real browser without runtime errors');
  ok(await b.client.from('blocks').insert({blocked_id:a.id}),'controlled bilateral block');
  check(!(await search(a,'@'+b.username)).length,'search hides blocked user with existing session');
  completed=true;
} finally {
  await browser?.close();
  // Only fixture-owned UUIDs are eligible for cleanup.
  if(groups.length)ok(await admin.from('communities').delete().in('id',groups),'remove controlled groups');
  for(const user of users){
    const files=ok(await admin.storage.from('avatars').list(user.id,{limit:1000}),'list controlled avatars');
    if(files.length)ok(await admin.storage.from('avatars').remove(files.map(f=>user.id+'/'+f.name)),'clean controlled avatar');
    ok(await admin.auth.admin.deleteUser(user.id),'clean controlled user');
  }
  writeFileSync(output+'/hosted.json',JSON.stringify({completed,checks,controlledAccounts:users.length,cleaned:true,productionMutated:false,physicalPhoneTested:false},null,2));
  console.log(JSON.stringify({completed,checks:checks.length,cleaned:users.length}));
}

// Disposable development account: statewide catalog, pagination, selectors and private game.
// node --env-file=.env.local --env-file=.env.hosted-admin tests/hosted-arena-state.mjs
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
await assertRemoteIdentity(process.env,'hosted-test');process.umask(0o077);
const origin=process.env.ARENA_STATE_BASE_URL || 'http://localhost:3038';assert.equal(new URL(origin).hostname,'localhost');
const output=process.env.PICO_REVIEW_DIR || '.vercel/arena-state-review';mkdirSync(output,{recursive:true});
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
  const email='pico-arena-state-'+randomBytes(9).toString('hex')+'@example.com',password=randomBytes(24).toString('base64url')+'Aa9!';
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
const arenas=async(user,search='',offset=0)=>(await api(user,'/api/social/read?'+new URLSearchParams({resource:'arenas',search,offset:String(offset)}))).data;
try {
  const a=await account('Teste do catálogo estadual');
  const pages=await Promise.all([0,24,48].map(offset=>arenas(a,'',offset)));
  check(pages.map(p=>p.arenas.length).join(',')==='24,24,12','all 60 arenas available across three pages');
  check(new Set(pages.flatMap(p=>p.arenas.map(a=>a.id))).size===60,'no duplicate or missing page entries');
  check(pages.map(p=>p.hasMore).join(',')==='true,true,false','pagination terminates correctly');
  const vinhedo=(await arenas(a,'vinhedo')).arenas;
  check(vinhedo.length===1 && vinhedo[0].name==='RS Sand Sports','city search reaches beyond first page');
  check(!pages[0].arenas.some(arena=>arena.id===vinhedo[0].id),'fixture is outside original first-page limit');
  check((await arenas(a,'Ribeirao Preto')).arenas.some(arena=>arena.city==='Ribeirão Preto'),'accent-insensitive city search');
  check((await arenas(a,vinhedo[0].name)).arenas.some(arena=>arena.id===vinhedo[0].id),'name search');
  check(!(await arenas(a,'%_')).arenas.length,'wildcard characters are literal');
  await api(a,'/api/social/read?resource=arenas&sportId=invalid',null,400);
  await api(null,'/api/social/read?resource=arenas&search=vinhedo',null,401);
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.addCookies([...a.jar].map(([name,value])=>({name,value,url:origin,sameSite:'Lax'})));
  await context.addInitScript(()=>localStorage.setItem('pico.install-dismissed','1'));
  const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/arenas');
  await page.getByRole('button',{name:'Entendi',exact:true}).click();
  const input=page.getByRole('searchbox',{name:'Buscar arenas',exact:true});await input.fill('vinhedo');
  await page.getByRole('heading',{name:'RS Sand Sports',exact:true}).waitFor();
  check(await page.locator('.arena-card').count()===1,'browser server search returns city result');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile directory fits viewport');
  await page.screenshot({path:output+'/arenas-vinhedo-390.png',fullPage:true});
  await input.fill('');await page.getByRole('navigation',{name:'Páginas de arenas'}).getByRole('button',{name:'Próxima'}).click();
  await page.getByText('Página 2',{exact:true}).waitFor();await input.fill('Cotia');
  await page.getByRole('heading',{name:'Riplay Granja Viana',exact:true}).waitFor();
  check(!(await page.getByText('Página 2',{exact:true}).count()),'search resets pagination');
  await page.goto(origin+'/jogos');await page.getByRole('button',{name:'Registrar jogo',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('searchbox',{name:'Buscar arena para arena',exact:true}).fill('vinhedo');
  await dialog.getByRole('option',{name:'RS Sand Sports · Vinhedo',exact:true}).waitFor({state:'attached'});
  await dialog.getByRole('combobox',{name:'Arena',exact:true}).selectOption(vinhedo[0].id);
  await dialog.getByRole('searchbox',{name:'Buscar arena para arena',exact:true}).fill('Campinas');
  await dialog.getByRole('option',{name:/Arena Aveiro/}).waitFor({state:'attached'});
  check(await dialog.getByRole('combobox',{name:'Arena',exact:true}).inputValue()===vinhedo[0].id,'search preserves chosen arena identity');
  await dialog.locator('input[type=date]').fill('2026-09-12');
  await page.screenshot({path:output+'/game-selector-390.png',fullPage:true});
  await dialog.getByRole('button',{name:'Guardar só para mim',exact:true}).click();
  await page.getByText('Jogo registrado. Só você pode ver.',{exact:true}).waitFor();
  check((await api(a,'/api/games?offset=0')).data.some(game=>game.arena_id===vinhedo[0].id),'new arena can be saved in private journal');
  check(ok(await admin.from('posts').select('id').eq('author_id',a.id),'read controlled publications').length===0,'game does not publish automatically');
  await page.goto(origin+'/feed');await page.getByRole('button',{name:'Compartilhe com sua turma',exact:true}).click();
  await dialog.getByText('Modalidade e local (opcionais)',{exact:true}).click();
  await dialog.getByRole('searchbox',{name:'Buscar arena para local',exact:true}).fill('vinhedo');
  await dialog.getByRole('option',{name:'RS Sand Sports · Vinhedo',exact:true}).waitFor({state:'attached'});
  await dialog.getByRole('combobox',{name:'Local',exact:true}).selectOption(vinhedo[0].id);
  check(await dialog.getByRole('combobox',{name:'Local',exact:true}).inputValue()===vinhedo[0].id,'publication selector reaches the statewide catalog');
  await page.goto(origin+'/arenas');await page.setViewportSize({width:1280,height:900});await page.emulateMedia({colorScheme:'dark'});
  await page.locator('.arena-card').first().waitFor();await page.screenshot({path:output+'/arenas-1280-dark.png',fullPage:false});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop directory fits viewport');
  check(errors.length===0,'browser without runtime errors');
  completed=true;
} finally {
  await browser?.close();
  for(const user of users){
    const files=ok(await admin.storage.from('avatars').list(user.id,{limit:1000}),'list controlled avatars');
    if(files.length)ok(await admin.storage.from('avatars').remove(files.map(f=>user.id+'/'+f.name)),'clean controlled avatar');
    ok(await admin.auth.admin.deleteUser(user.id),'clean controlled user');
  }
  writeFileSync(output+'/hosted.json',JSON.stringify({completed,checks,controlledAccounts:users.length,cleaned:true,productionMutated:false,physicalPhoneTested:false},null,2));
  console.log(JSON.stringify({completed,checks:checks.length,cleaned:users.length}));
}

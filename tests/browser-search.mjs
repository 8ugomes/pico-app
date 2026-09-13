// Real app UI with intercepted APIs; no remote data or social writes.
// SEARCH_BASE_URL=http://localhost:3037 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/browser-search.mjs
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin=process.env.SEARCH_BASE_URL || 'http://localhost:3037';
assert.equal(new URL(origin).hostname,'localhost');
const output=process.env.PICO_REVIEW_DIR || '.vercel/search-review';mkdirSync(output,{recursive:true});
const version=execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8'}).trim();
const sport={id:'10000000-0000-4000-8000-000000000001',name:'Futevôlei',slug:'futevolei'};
const profile={id:'30000000-0000-4000-8000-000000000001',username:'alice_teste',name:'Alice Teste',onboardingCompleted:true,avatar:'/icon.svg',avatarPath:'fixture.webp',bio:'',city:'',neighborhood:'',sports:[{sport,level:'Iniciante',isPrimary:true}]};
const players=Array.from({length:27},(_,i)=>({id:`player-${i}`,username:`joao_${i}`,display_name:`João da areia ${i}`,sport_name:sport.name,sport_slug:sport.slug,level:'Iniciante',connected:false,avatar:null,city:'São Paulo',neighborhood:'Pinheiros',bio:'Perfil ilustrativo de teste.',is_demo:true}));
const groups=[{id:'private-group',slug:'volei-sao-joao',name:'Vôlei São João',description:null,visibility:'private',entry_mode:'approval',membership:null}, {id:'my-group',slug:'minha-turma',name:'Minha turma',description:'Grupo ilustrativo.',visibility:'beta',entry_mode:'open',membership:'active'}];
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const checks=[], errors=[], requests=[], writes=[];
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome'});
const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
await context.addInitScript(()=>localStorage.setItem('pico.install-dismissed','1'));
let fail=false;
await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==origin)return route.abort();
  if(!url.pathname.startsWith('/api/'))return route.continue();
  const send=(data,status=200)=>route.fulfill({status,json:data,headers:{'cache-control':'no-store'}});
  const q=url.searchParams,r=q.get('resource');requests.push(url.pathname+url.search);
  if(req.method()!=='GET' && url.pathname!=='/api/welcome')writes.push(url.pathname);
  if(url.pathname==='/api/access')return send({admitted:true,signedIn:true});
  if(url.pathname==='/api/version')return send({version});
  if(url.pathname==='/api/welcome')return send({data:{pending:false}});
  if(url.pathname==='/api/activity')return send({data:[]});
  if(url.pathname==='/api/social/read'){
    if(r==='profile')return send({status:'success',data:{kind:r,profile}});
    if(r==='arenas')return send({status:'success',data:{kind:r,arenas:[],sports:[sport],hasMore:false}});
    if(r==='discover'){
      if(fail)return send({status:'error',code:'unavailable',message:'Não foi possível carregar agora.'},503);
      const term=norm(q.get('search')||'');
      const filtered=players.filter(p=>term.startsWith('@')?norm(p.username).includes(term.slice(1)):norm(p.display_name+' '+p.username).includes(term));
      const offset=Number(q.get('offset')||0);
      if(term==='atrasada')await new Promise(r=>setTimeout(r,700));
      return send({status:'success',data:{kind:r,players:filtered.slice(offset,offset+24),hasMore:filtered.length>offset+24}});
    }
  }
  if(url.pathname==='/api/communities'){
    if(fail)return send({message:'Não foi possível carregar agora.'},503);
    const term=norm(q.get('search')||'');
    return send({data:groups.filter(g=>norm(g.name).includes(term)&&(q.get('mine')!=='true'||g.membership==='active'))});
  }
  return send({data:[]});
});
const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const check=(value,label)=>{assert.ok(value,label);checks.push(label)};
async function count(selector,n){await page.waitForFunction(({selector,n})=>document.querySelectorAll(selector).length===n,{selector,n});}
try {
  await page.goto(origin+'/descobrir');
  const search=page.getByRole('searchbox',{name:'Buscar pessoas por nome ou usuário'});
  await search.waitFor();await count('.person-row',24);
  await page.getByRole('button',{name:'Próxima',exact:true}).click();await count('.person-row',3);
  await search.fill('@JOAO_26');await count('.person-row',1);
  check((await page.locator('.person-row a').getAttribute('href'))==='/perfil/joao_26','@handle search opens the correct profile');
  check(requests.some(r=>r.includes('search=%40JOAO_26')&&r.includes('offset=0')),'new search resets server pagination');
  await page.screenshot({path:output+'/people-light-390.png',fullPage:true});
  await search.fill('ninguém');await page.getByRole('heading',{name:'Nenhuma pessoa nesta busca.'}).waitFor();
  await page.getByRole('button',{name:'Limpar busca',exact:true}).click();await count('.person-row',24);
  checks.push('empty search recovers by clearing');
  await search.fill('atrasada');await page.waitForRequest(r=>r.url().includes('search=atrasada'));
  await search.fill('@joao_25');await count('.person-row',1);await page.waitForTimeout(850);
  check((await page.locator('.person-row a').getAttribute('href'))==='/perfil/joao_25','late responses cannot overwrite the latest search');
  fail=true;await search.fill('falha');await page.getByRole('button',{name:'Tentar novamente',exact:true}).waitFor();
  fail=false;await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await page.getByRole('heading',{name:'Nenhuma pessoa nesta busca.'}).waitFor();checks.push('people errors allow retry');
  await page.getByRole('link',{name:'Buscar comunidades',exact:true}).click();
  await page.getByRole('searchbox',{name:'Buscar comunidades',exact:true}).waitFor();await count('.community-card',2);
  check(await page.getByRole('button',{name:'Explorar',exact:true}).getAttribute('aria-pressed')==='true','community directory starts in Explore');
  await page.getByRole('searchbox').fill('volei sao');await count('.community-card',1);
  check((await page.locator('.community-card').innerText()).includes('Somente participantes ativos'),'private group access remains labeled');
  check(await page.locator('.community-purpose').count()===0,'private description is absent');
  await page.getByRole('button',{name:'Minhas comunidades',exact:true}).click();await count('.community-card',0);
  await page.getByRole('button',{name:'Buscar em todas as comunidades',exact:true}).click();await count('.community-card',1);
  check(await page.getByRole('searchbox').inputValue()==='volei sao','expand scope preserves search text');
  await page.screenshot({path:output+'/communities-light-390.png',fullPage:true});
  fail=true;await page.getByRole('searchbox').fill('erro');await page.getByRole('button',{name:'Tentar novamente',exact:true}).waitFor();fail=false;
  await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await page.getByRole('heading',{name:'Nenhum grupo com esse nome.'}).waitFor();checks.push('community errors allow retry');
  await page.setViewportSize({width:1280,height:900});await page.emulateMedia({colorScheme:'dark'});
  await page.getByRole('searchbox').fill('volei');await count('.community-card',1);
  await page.screenshot({path:output+'/communities-dark-desktop.png',fullPage:true});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop has no horizontal overflow');
  await page.setViewportSize({width:320,height:740});await page.addStyleTag({content:':root{font-size:200%}'});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'320px enlarged text has no horizontal overflow');
  await page.screenshot({path:output+'/communities-dark-320-text200.png',fullPage:true});
  await page.getByRole('link',{name:'Buscar pessoas e comunidades',exact:true}).click();await search.waitFor();
  await search.focus();check(await search.evaluate(el=>el===document.activeElement),'search accepts keyboard focus');
  check(writes.length===0,'search makes no social writes');check(errors.length===0,'no browser runtime errors');
} finally {
  writeFileSync(output+'/browser.json',JSON.stringify({checks,errors,writes,fixture:true,remoteValidated:false},null,2));
  await browser.close();console.log(JSON.stringify({checks:checks.length,errors:errors.length,writes:writes.length}));
}

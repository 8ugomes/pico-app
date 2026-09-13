// Actual Next UI. Demo is local; connected APIs below are explicit in-memory
// fixtures. All requests outside localhost are blocked. No hosted data or writes.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const out=process.env.PICO_REVIEW_DIR||'docs/visual-review/post-game';mkdirSync(out,{recursive:true});
const results=[];
const demoUrl=process.env.PICO_DEMO_URL||'http://localhost:3013';
const connectedUrl=process.env.PICO_CONNECTED_URL||'http://localhost:3015';
const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await ctx.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function visible(locator){await locator.waitFor({state:'visible'});}
async function noPresence(){assert.doesNotMatch(await page.locator('body').innerText(),/check-in|na areia agora|encerrar presença|até \d\d:\d\d/i);}
async function fits(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');}
try{
 for(const width of [320,390,430]) {
  await page.setViewportSize({width,height:844});
  await page.goto(demoUrl+'/jogos');await visible(page.getByRole('heading',{name:'Meus jogos',exact:true}));await fits();
  await page.screenshot({path:`${out}/demo-empty-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/feed','/arenas','/arenas/areia-da-vila','/descobrir','/perfil','/perfil/marinaalves','/comunidades','/privacidade','/instalar']) {
  await page.goto(demoUrl+path);await page.locator('main').waitFor();await noPresence();await fits();results.push('demo '+path);
 }
 await page.goto(demoUrl+'/checkin?arena=areia-da-vila');await page.waitForURL('**/jogos?arena=areia-da-vila');
 let dialog=page.getByRole('dialog');await visible(dialog);await dialog.getByLabel('Data do jogo').fill('2026-01-01');
 await dialog.getByRole('button',{name:'Guardar só para mim'}).click();await visible(page.getByText('Jogo registrado nesta demonstração. Só você vê.',{exact:true}));
 await visible(page.locator('.game-entry-date').filter({hasText:'Jogado em'}));await noPresence();await page.screenshot({path:`${out}/demo-saved-390.png`,fullPage:true});
 await page.getByRole('button',{name:'Corrigir jogo'}).click();await dialog.getByLabel('Data do jogo').fill('2026-01-02');await dialog.getByRole('button',{name:'Salvar correção'}).click();await visible(page.getByText('2 de janeiro de 2026',{exact:true}));
 await page.getByRole('button',{name:'Excluir registro'}).click();await dialog.getByRole('button',{name:'Excluir registro',exact:true}).click();await visible(page.getByText('Registro excluído nesta demonstração.',{exact:true}));results.push('demo create/edit/delete and old route redirect');
 await page.goto(demoUrl+'/jogos?arena=areia-da-vila');await visible(dialog);await dialog.getByLabel('Data do jogo').fill('2099-01-01');await dialog.getByRole('button',{name:'Guardar só para mim'}).click();assert.equal(await dialog.getByLabel('Data do jogo').evaluate(el=>el.validity.rangeOverflow),true);results.push('demo future blocked by date control');
 // Connected UI fixture: fail one save, then lose one acknowledgement after commit.
 const arena={id:'20000000-0000-4000-8000-000000000001',slug:'areia-da-vila',name:'Areia da Vila',description:'Arena de fixture local',neighborhood:'Teste',city:'São Paulo',image:null,isDemo:true,sports:[{id:'10000000-0000-4000-8000-000000000001',slug:'futevolei',name:'Futevôlei'}]};
 const games=[];const writes=[];let failRead=true,failSave=true,loseAck=false;
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),body=req.method()==='POST'?req.postDataJSON():{};
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.pathname==='/api/access')return send({admitted:true,signedIn:true});
  if(url.pathname==='/api/welcome')return send({data:null});
  if(url.pathname==='/api/version')return send({version:'fixture',environment:'development'});
  if(url.pathname==='/api/games') {
   if(req.method()==='GET')return failRead?send({message:'Falha controlada ao carregar os jogos.'},503):send({data:games});
   writes.push(body);
   if(failSave){failSave=false;return send({message:'Falha controlada. Tente novamente.'},503);}
   if(body.action==='delete'){const i=games.findIndex(g=>g.id===body.id);if(i>=0)games.splice(i,1);return send({data:{id:body.id}});}
   const old=games.find(g=>g.id===body.id);
   if(!old)games.push({id:body.id,arena_id:arena.id,arena_slug:arena.slug,arena_name:arena.name,is_demo:true,sport_id:arena.sports[0].id,sport_slug:'futevolei',sport_name:'Futevôlei',played_on:body.playedOn,created_at:'2026-09-12T12:00:00Z',version:1});
   else if(old.played_on!==body.playedOn){old.played_on=body.playedOn;old.version++;}
   if(loseAck){loseAck=false;return send({message:'Resposta interrompida. Confira ou repita.'},503);}
   return send({data:{id:body.id}});
  }
  if(url.pathname==='/api/social/read')return send({status:'success',data:url.searchParams.get('resource')==='arena'?{kind:'arena',arena}:{kind:'arenas',arenas:[arena],sports:arena.sports,offset:0,hasMore:false}});
  return send({message:'API não prevista na fixture '+url.pathname},400);
 });
 await page.goto(connectedUrl+'/jogos');await visible(page.getByText('Falha controlada ao carregar os jogos.',{exact:true}));await page.screenshot({path:`${out}/connected-error-390.png`,fullPage:true});
 failRead=false;await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await visible(page.getByRole('heading',{name:'As lembranças começam com um jogo.'}));
 await page.getByRole('button',{name:'Registrar jogo',exact:true}).click();await dialog.getByLabel(/^Arena/).selectOption(arena.id);await dialog.getByLabel('Data do jogo').fill('2026-01-01');
 await dialog.getByRole('button',{name:'Guardar só para mim'}).click();await visible(dialog.getByRole('alert'));assert.equal(await dialog.getByLabel('Data do jogo').inputValue(),'2026-01-01');
 await page.screenshot({path:`${out}/connected-draft-error-390.png`,fullPage:true});
 loseAck=true;await dialog.getByRole('button',{name:'Guardar só para mim'}).click();await visible(dialog.getByText(/Resposta interrompida/));
 await dialog.getByRole('button',{name:'Guardar só para mim'}).click();await visible(page.getByText('Jogo registrado. Só você pode ver.',{exact:true}));assert.equal(games.length,1);assert.equal(new Set(writes.map(w=>w.id)).size,1);
 await page.screenshot({path:`${out}/connected-saved-390.png`,fullPage:true});await noPresence();await fits();
 await page.getByRole('button',{name:'Corrigir jogo'}).click();await dialog.getByLabel('Data do jogo').fill('2026-01-02');await dialog.getByRole('button',{name:'Salvar correção'}).click();await visible(page.getByText('2 de janeiro de 2026',{exact:true}));
 await page.getByRole('button',{name:'Excluir registro'}).click();await dialog.getByRole('button',{name:'Excluir registro',exact:true}).click();await visible(page.getByText('Registro excluído.',{exact:true}));assert.equal(games.length,0);
 results.push('connected read error/retry, save error preserves draft, lost acknowledgement retains ID, private create/edit/delete');
 for(const width of [320,390,430]) {await page.setViewportSize({width,height:620});await page.getByRole('button',{name:'Registrar jogo',exact:true}).click();await dialog.getByLabel(/^Arena/).selectOption(arena.id);await dialog.getByLabel('Data do jogo').fill('2026-01-01');await fits();assert.ok(await dialog.getByRole('button',{name:'Guardar só para mim'}).isVisible());await dialog.getByRole('button',{name:'Guardar só para mim'}).scrollIntoViewIfNeeded(); const bounds=await dialog.getByRole('button',{name:'Guardar só para mim'}).boundingBox(); assert.ok(bounds && bounds.y>=0 && bounds.y+bounds.height<=620); await page.screenshot({path:`${out}/connected-form-${width}.png`});await page.keyboard.press('Escape');}
 results.push('320/390/430px, 620px height, Escape and form fit');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/checks.json`,JSON.stringify({fixture:true,hosted:false,physicalDevice:false,results},null,2));console.log(JSON.stringify({checks:results,errors},null,2));
}catch(error){await page.screenshot({path:"/tmp/pico-games-browser-failure.png",fullPage:true});console.error(await page.locator("body").innerText());throw error;}finally{await browser.close();}

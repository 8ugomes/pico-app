/** Isolated component/browser regressions. No real account, API or Storage.
 * npm ci; npm install --no-save --package-lock=false esbuild@0.25.12 @playwright/test@1.58.2
 * npx playwright install --with-deps chromium webkit
 * python tests/helpers/make-heic.py (requires pillow-heif 1.1.1)
 * node tests/browser-profile.mjs
 */
import { build } from 'esbuild';
import { chromium, webkit, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

const root=process.cwd(), output=resolve('.vercel/profile-browser');mkdirSync(output,{recursive:true});
const shell=`import React from 'react';import{createRoot}from'react-dom/client';import{ConnectedProfile}from'${root}/src/components/pico/connected/ConnectedProfile';import{PublicationComposer}from'${root}/src/components/pico/connected/PublicationComposer';import{preparePhoto}from'${root}/src/lib/photos/image';window.preparePhoto=preparePhoto;createRoot(document.getElementById('root')).render(<React.StrictMode><main className="social-main">{location.search.includes('composer')?<PublicationComposer viewerId="11111111-1111-4111-8111-111111111111" onDone={()=>{}}/>:<ConnectedProfile/>}</main></React.StrictMode>);`;
const nextStubs={
  'next/link':`import React from 'react';export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}`,
  'next/image':`import React from 'react';export default function Image({unoptimized,fill,priority,...props}){return <img {...props}/>}`,
  'next/dynamic':`import React,{Suspense,lazy}from'react';export default function dynamic(load,options={}){const Component=lazy(load);return function Dynamic(props){return <Suspense fallback={options.loading?.()||null}><Component {...props}/></Suspense>}}`,
  'next/navigation':`export const useRouter=()=>({push:()=>{},replace:()=>{},refresh:()=>{}});export const usePathname=()=>'/perfil';`,
};
const plugins=[{name:'browser-framework-fixtures',setup(api){
 api.onResolve({filter:/^next\/(link|image|dynamic|navigation)$/},args=>({path:args.path,namespace:'framework'}));
 api.onLoad({filter:/.*/,namespace:'framework'},args=>({contents:nextStubs[args.path],loader:'tsx',resolveDir:root}));
 api.onResolve({filter:/(^@\/lib\/supabase\/client$|\/lib\/supabase\/client$)/},()=>({path:'auth',namespace:'framework-auth'}));
 api.onLoad({filter:/.*/,namespace:'framework-auth'},()=>({contents:`export function createClient() {
 return { auth: { onAuthStateChange(callback) {
   const listener = e => callback(e.detail.event, e.detail.session);
   window.addEventListener('fixture-auth', listener);
   queueMicrotask(() => callback('INITIAL_SESSION', {user:{id:'11111111-1111-4111-8111-111111111111'}}));
   return { data: { subscription: { unsubscribe() { window.removeEventListener('fixture-auth', listener); } } } };
 } } };
}`,loader:'ts'}));
}}];
await build({stdin:{contents:shell,loader:'tsx',resolveDir:root},outdir:join(output,'app'),entryNames:'app',bundle:true,splitting:true,format:'esm',jsx:'automatic',platform:'browser',target:'es2022',plugins,alias:{'@':join(root,'src')},define:{'process.env.NODE_ENV':'"development"','process.env.NEXT_PUBLIC_PICO_ENV':'"demo"','process.env.NEXT_PUBLIC_PICO_VERSION':'"test"','process.env.NEXT_PUBLIC_SUPABASE_URL':'undefined','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'undefined'}});
const styles=['globals.css','social.css','social-pages.css','forms.css','profile.css'].map(file=>readFileSync(join(root,'src/app',file),'utf8').replace(/^@import.*$/gm,'').replace(/@theme inline\s*\{[^}]*\}/g,'')).join('\n');
writeFileSync(join(output,'style.css'),styles+'\nbody{max-width:620px;margin:auto}#root{padding-top:20px}a{color:inherit}');
const html='<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/app/app.js"></script></html>';
// Receive image bytes through real loopback HTTP. Browser protocol inspection
// may omit binary Blob bodies; it is not evidence that an upload was empty.
const mediaFixture = { stored: null, uploads: 0, wireFormat: null };
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/media'){
  res.setHeader('Cache-Control','private, no-store');
  if(req.method==='POST'){
   const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>3*1024*1024)throw Error('Fixture upload too large');chunks.push(chunk);}
   const bytes=Buffer.concat(chunks);const info=await sharp(bytes).metadata();
   if(!['png','webp','jpeg'].includes(info.format)||info.width!==info.height||info.width>512||info.exif)throw Error('Crop wire contract failed');
   mediaFixture.wireFormat=info.format;mediaFixture.stored=await sharp(bytes).webp().toBuffer();mediaFixture.uploads++;
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'success',data:{bucket:'avatars',path:id+'/33333333-3333-4333-8333-333333333333.webp'}}));return;
  }
  if(req.method==='GET'&&mediaFixture.stored){res.setHeader('Content-Type','image/webp');res.end(mediaFixture.stored);return;}
  if(req.method==='DELETE'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'success'}));return;}
  res.writeHead(404);res.end('Missing fixture media');return;
 }
 if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 const path=resolve(output,'.'+url.pathname);if(!path.startsWith(output+'/'))throw Error();res.setHeader('Content-Type',path.endsWith('.css')?'text/css':'text/javascript');res.end(readFileSync(path));
}catch(error){res.writeHead(400);res.end(String(error.message));}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`;
const id='11111111-1111-4111-8111-111111111111',sport={id:'22222222-2222-4222-8222-222222222222',slug:'futevolei',name:'Futevôlei'};
const original={id,name:'Alex da Areia',username:'alex_teste',bio:'Futevôlei, amigos e um jogo no fim do dia.',city:'São Paulo',neighborhood:'Vila Mariana',avatar:null,avatarPath:null,available:true,isDemo:false,onboardingCompleted:true,sports:[{sport,level:'Intermediário',isPrimary:true}]};
const summary=[];let currentBrowser=null,currentPage=null;
try {
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();currentBrowser=browser;const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();currentPage=page;
  let profile=structuredClone(original),readCount=0,saveCount=0,failSave=false;mediaFixture.stored=null;mediaFixture.uploads=0;mediaFixture.wireFormat=null;const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!(m.text().includes('503')&&m.location().url.includes('/api/social/mutate')))errors.push(m.text())});
  await page.route(/\/api\/(?!media(?:\?|$)).*/,async route=>{const request=route.request(),url=new URL(request.url());let data={};
   if(url.pathname==='/api/social/read'){
    if(url.searchParams.get('resource')==='profile'){readCount++;data={status:'success',data:{kind:'profile',profile}};}
    else if(url.searchParams.get('resource')==='sports')data={status:'success',data:{kind:'sports',sports:[sport]}};
    else data={status:'success',data:{kind:'checkin',own:null,presence:[]}};
   }else if(url.pathname==='/api/social/mutate'){
    const body=request.postDataJSON();if(failSave){await route.fulfill({status:503,json:{status:'error',message:'Falha controlada de teste.'}});return;}
    if(body.action==='save_profile'){saveCount++;profile={...profile,...body,sports:[{sport,level:body.level,isPrimary:true}]};}
    if(body.action==='set_avatar'){profile.avatarPath=body.path;profile.avatar=body.path?'/api/media?bucket=avatars&path='+body.path:null;}
    data={status:'success'};
   }else if(url.pathname==='/api/manage')data={data:{platformRole:'admin',arenas:[],communities:[]}};
   else if(url.pathname==='/api/posts')data={data:url.searchParams.get('kind')==='options'?{arenas:[],communities:[]}:{posts:[],viewerId:profile.id,hasMore:false}};
   else if(url.pathname==='/api/activity')data={data:url.searchParams.get('kind')==='places'?{own:true,share_activity_summary:false,arenas:[],communities:[]}:url.searchParams.get('kind')==='summary'?null:[]};
   await route.fulfill({status:200,json:data});
  });
  await page.goto(origin);await expect(page.getByRole('heading',{name:original.name,exact:true})).toBeVisible();
  await page.screenshot({path:join(output,`${name}-profile.png`),fullPage:true});
  for(let i=0;i<20;i++){
   await page.getByRole('button',{name:'Editar perfil',exact:true}).click();await expect(page.getByTestId('profile-editor')).toHaveCount(1);await expect(page.getByRole('form',{name:'Editar informações do perfil'})).toHaveCount(1);
   await expect(page.getByTestId('profile-view')).toHaveCount(0);await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();await expect(page.getByTestId('profile-editor')).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Editar perfil',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Rascunho preservado');const before=readCount;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>readCount).toBeGreaterThan(before);await expect(page.getByLabel('Nome',{exact:true})).toHaveValue('Rascunho preservado');
  failSave=true;await page.getByRole('button',{name:'Salvar perfil',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Falha controlada');await expect(page.getByLabel('Nome',{exact:true})).toHaveValue('Rascunho preservado');failSave=false;
  await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();await expect(page.getByRole('dialog',{name:'Descartar alterações?'})).toBeVisible();await page.getByRole('button',{name:'Continuar editando',exact:true}).click();await expect(page.getByLabel('Nome',{exact:true})).toHaveValue('Rascunho preservado');
  await page.getByLabel('Nome',{exact:true}).fill('Alex do Pico');await page.screenshot({path:join(output,`${name}-editor.png`),fullPage:true});await page.getByRole('button',{name:'Salvar perfil',exact:true}).click();await expect(page.getByTestId('profile-editor')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Alex do Pico',exact:true})).toBeVisible();if(saveCount!==1)throw Error('Profile persisted more than once');
  await page.getByRole('tab',{name:'Meus Picos',exact:true}).click();await expect(page.getByRole('heading',{name:'Picos e comunidades',exact:true})).toBeVisible();await page.getByRole('tab',{name:'Meus Picos',exact:true}).press('ArrowRight');await expect(page.getByRole('heading',{name:'Seu histórico privado',exact:true})).toBeVisible();
  for(const width of [320,390,430,768]){await page.setViewportSize({width,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error(`Profile overflow ${width}`);await page.getByRole('button',{name:'Editar perfil',exact:true}).click();if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error(`Editor overflow ${width}`);await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();}
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error('Profile overflow with 200% text');
  await page.getByRole('button',{name:'Editar perfil',exact:true}).click();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error('Editor overflow with 200% text');
  if(await page.getByRole('button',{name:'Salvar perfil',exact:true}).evaluate(button=>getComputedStyle(button).transitionDuration!=='0s'))throw Error('Reduced motion was not respected');
  await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();
  await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Editar perfil',exact:true}).click();await page.getByText('Alterar foto',{exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:'broken.heic',mimeType:'image/heic',buffer:Buffer.from('not a valid photo')});await expect(page.getByRole('alert')).toContainText('Formato não reconhecido');if(mediaFixture.uploads!==0)throw Error('Invalid original was uploaded');
  await page.locator('input[type=file]').setInputFiles(join(root,'.vercel/heic-fixture.heic'));await expect(page.getByRole('dialog',{name:'Ajustar foto'})).toBeVisible({timeout:60000});
  await page.getByLabel('Zoom da foto',{exact:true}).fill('1.5');await page.getByRole('button',{name:'Girar 90°',exact:true}).click();await page.screenshot({path:join(output,`${name}-heic-crop.png`)});await page.getByRole('button',{name:'Confirmar enquadramento',exact:true}).click();await expect(page.getByRole('dialog',{name:'Ajustar foto'})).toHaveCount(0);await page.getByRole('button',{name:'Usar esta foto',exact:true}).click();await expect(page.getByText('Foto de perfil atualizada.',{exact:true})).toBeVisible();const meta=await sharp(mediaFixture.stored).metadata();if(meta.format!=='webp'||meta.width!==meta.height||meta.width>512||meta.exif)throw Error('Normalized crop contract failed');
  await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();await expect(page.getByRole('img',{name:'Foto de Alex do Pico',exact:true})).toBeVisible();
  // Account changes must remount the single editor identity, clearing its draft.
  await page.getByRole('button',{name:'Editar perfil',exact:true}).click();await page.getByLabel('Bio',{exact:true}).fill('PRIVATE DRAFT');profile={...structuredClone(original),id:'44444444-4444-4444-8444-444444444444',name:'Outra conta'};
  await page.evaluate(id=>window.dispatchEvent(new CustomEvent('fixture-auth',{detail:{event:'SIGNED_IN',session:{user:{id}}}})),profile.id);await expect(page.getByRole('heading',{name:'Outra conta',exact:true})).toBeVisible();await expect(page.getByText('PRIVATE DRAFT',{exact:true})).toHaveCount(0);
  // Regression: the photo dialog is nested inside the publication dialog.
  // Escape must close only the photo editor, restore focus, and preserve the draft.
  await page.goto(origin+'?fixture=composer');
  await page.getByRole('button',{name:'Compartilhe com sua turma',exact:true}).click();
  await page.getByRole('textbox',{name:'Sua publicação',exact:true}).fill('Rascunho preservado.');
  await page.locator('input[type=file]').setInputFiles({name:'crop-test.png',mimeType:'image/png',buffer:await sharp({create:{width:600,height:400,channels:3,background:'#182e2a'}}).png().toBuffer()});
  await expect(page.getByRole('dialog',{name:'Ajustar foto',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'Ajustar foto',exact:true})).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:'Compartilhe com sua turma',exact:true})).toBeVisible();
  await expect(page.locator('input[type=file]')).toBeFocused();
  await expect(page.getByRole('textbox',{name:'Sua publicação',exact:true})).toHaveValue('Rascunho preservado.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Compartilhe com sua turma',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Compartilhe com sua turma',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Sua publicação',exact:true})).toHaveValue('Rascunho preservado.');
  await page.getByRole('button',{name:'Fechar',exact:true}).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'Publicar no meu perfil',exact:true})).toBeFocused();
  if(errors.length)throw Error(errors.join('\n'));summary.push({browser:name,textScale200:true,reducedMotion:true,nestedPhotoDialog:true,photoFocusReturn:true,publicationDraftPreserved:true,dialogFocusTrap:true,editToggles:20,singleEditor:true,draftOnFocus:true,failedSavePreservesDraft:true,discardDialog:true,oneWrite:true,tabKeyboard:true,viewports:[320,390,430,768],realHeicDecode:true,wireFormat:mediaFixture.wireFormat,crop:meta.width+'x'+meta.height,privateMetadataStripped:true,accountSwitch:true});await browser.close();
 }
 writeFileSync(join(output,'results.json'),JSON.stringify({scope:'Isolated real React components; synthetic API, account and Storage. Chromium/WebKit, not physical devices.',results:summary},null,2));console.log(JSON.stringify(summary,null,2));
}catch(error){if(currentPage)await currentPage.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});writeFileSync(join(output,'failure.txt'),String(error.stack||error));throw error;}finally{await currentBrowser?.close();server.close();}

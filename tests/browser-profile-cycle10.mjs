// Isolated UI harness: real profile/editor components, mocked services, no user data.
// HEIC conversion uses the actual decoder/worker against libheif's example file.
import { build } from '../.vercel/cycle10-test-tools/node_modules/esbuild/lib/main.js';
import { chromium } from '../.vercel/cycle10-test-tools/node_modules/playwright/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const out = resolve('.vercel/cycle10-browser');
await mkdir(out, { recursive: true });
const mocks = {
  'next/link': `import React from 'react'; export default function Link({children,...props}){return <a {...props}>{children}</a>}`,
  './useRemoteRead': `export function useRemoteRead(){return {state:{status:'success',data:{kind:'sports',sports:[{id:'sport-a',name:'Futevôlei',slug:'futevolei'}]}},retry:()=>{},refresh:()=>{}}}`,
  './useMutation': `import React,{useState} from 'react';export function useMutation(){const[busy,setBusy]=useState(false),[message,setMessage]=useState('');return{busy,message,run:async(data)=>{setBusy(true);await Promise.resolve();if(window.__failSave){setMessage('Falha simulada. Tente novamente.');setBusy(false);return false;}window.__lastMutation=data;if(data.action==='save_profile')window.__profile={...window.__profile,...data,onboardingCompleted:true};if(data.action==='set_avatar')window.__profile={...window.__profile,avatarPath:data.path};setMessage('Salvo.');setBusy(false);return true;}}}export function MutationNotice({message}){return <p role="status">{message}</p>}`,
  './Media': `import React from 'react';export function RemoteAvatar({name}){return <span style={{display:'grid',placeItems:'center'}} aria-label={'Foto de '+name}>P</span>}export function PhotoUpload({onChange}){return <button type="button" onClick={()=>onChange('owned/photo.webp')}>Selecionar foto de teste</button>}export async function removePhoto(){}`,
  './ConnectedFeed': `import React from 'react';export function ConnectedFeed(){return <p>Publicações de teste.</p>}`,
  './ActivityHistory': `import React from 'react';export function ActivityHistory(){return <p>Histórico privado de teste.</p>}export function ProfilePlaces(){return <p>Arenas e comunidades de teste.</p>}`,
  '../SocialUI': `import React from 'react';export function SportIcon(){return <span aria-hidden="true">◌</span>}`,
};
const mockPlugin = { name: 'isolated-profile-services', setup(builder) {
  builder.onResolve({ filter: /^(next\/link|\.\/useRemoteRead|\.\/useMutation|\.\/Media|\.\/ConnectedFeed|\.\/ActivityHistory|\.\.\/SocialUI)$/ }, args => ({path:args.path,namespace:'test-mock'}));
  builder.onLoad({ filter: /.*/, namespace: 'test-mock' }, args => ({contents:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
  builder.onLoad({ filter: /heic-browser\.ts$/ }, async args => ({contents:(await readFile(args.path,'utf8')).replace("'./heic.worker.ts'", "'./heic-worker.js'"),loader:'ts',resolveDir:resolve('src/lib/photos')}));
}};
const initial = {id:'test-a',name:'Jogador de teste',username:'jogador_teste',bio:'Futevôlei e uma boa resenha depois do jogo.',city:'São Paulo',neighborhood:'Vila Mariana',avatar:null,avatarPath:null,isDemo:false,onboardingCompleted:true,available:true,sports:[{sport:{id:'sport-a',name:'Futevôlei',slug:'futevolei'},level:'Intermediário',isPrimary:true}]};
await build({stdin:{contents:`import React,{StrictMode,useState} from 'react';import{createRoot}from'react-dom/client';import{ProfileWorkspace}from'./src/components/pico/connected/ConnectedProfile';import{preparePhoto,renderCrop}from'./src/lib/photos/image';import{decodeHeic}from'./src/lib/photos/heic-browser';window.preparePhoto=preparePhoto;window.renderCrop=renderCrop;window.decodeHeic=decodeHeic;window.__profile=${JSON.stringify(initial)};function App(){const[p,setP]=useState(window.__profile);window.__refresh=()=>setP({...window.__profile});window.__switch=()=>{window.__profile={...window.__profile,id:'test-b',name:'Outra conta',username:'outra_conta'};setP(window.__profile)};return <ProfileWorkspace key={p.id} profile={p} refresh={()=>setP({...window.__profile})}/>};createRoot(document.getElementById('app')).render(<StrictMode><App/></StrictMode>);`,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',splitting:true,outdir:out,entryNames:'profile',chunkNames:'chunk-[hash]',plugins:[mockPlugin],define:{'process.env.NODE_ENV':'"development"'},jsx:'automatic'});
await build({entryPoints:['src/lib/photos/heic.worker.ts'],bundle:true,format:'esm',platform:'browser',outfile:resolve(out,'heic-worker.js')});
await writeFile(resolve(out,'index.html'),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/profile.css"><style>*{box-sizing:border-box}body{margin:0;background:#07080a;color:#f7f3ea;font-family:Arial,sans-serif}#app{max-width:740px;padding:20px;margin:auto}button,input,select,textarea{font:inherit}button{min-height:44px;padding:10px 16px;border-radius:12px;border:1px solid #343639;color:inherit;background:#232529;cursor:pointer}button:disabled{opacity:.5}a{color:inherit;text-decoration:none}.input-group{display:grid;gap:8px;font-size:14px}.input{width:100%;min-height:46px;color:inherit;background:#1b1d21;border:1px solid #3b3d40;border-radius:12px;padding:12px}.input-hint{font-size:12px;color:#b9bcb9}.read-message-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}dialog{max-width:92vw;background:#111317;color:inherit;border:1px solid #555;border-radius:22px;padding:24px}dialog::backdrop{background:#000b}</style><div id="app"></div><script type="module" src="/profile.js"></script></html>`);
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=pathname==='/'?resolve(out,'index.html'):resolve(out,'.'+pathname);if(!file.startsWith(out+'/')){res.writeHead(403);res.end();return}const body=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.heic':'image/heic'})[extname(file)]||'application/octet-stream');res.end(body)}catch{res.writeHead(404);res.end()}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++}
try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'&&/same key|unique.*key/i.test(message.text()))errors.push(message.text())});
  await page.goto(origin);await page.getByRole('button',{name:'Editar perfil',exact:true}).waitFor();
  await page.screenshot({path:resolve(out,'profile.png'),fullPage:true});
  for(let index=0;index<12;index++){
    await page.getByRole('button',{name:'Editar perfil',exact:true}).click();
    check(await page.locator('[data-testid="profile-editor"]').count()===1,'one profile editor');
    check(await page.locator('[data-testid="avatar-editor"]').count()===1,'one avatar editor');
    check(await page.getByLabel('Nome',{exact:true}).count()===1,'one name field');
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
    check(await page.locator('[data-testid="profile-editor"]').count()===0,'editor fully unmounts');
  }
  await page.getByRole('button',{name:'Editar perfil',exact:true}).click();
  await page.getByLabel('Nome',{exact:true}).fill('Nome em edição');
  await page.evaluate(()=>window.__refresh());
  check(await page.getByLabel('Nome',{exact:true}).inputValue()==='Nome em edição','refresh preserves draft');
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await page.getByRole('button',{name:'Continuar editando',exact:true}).click();
  check(await page.getByLabel('Nome',{exact:true}).inputValue()==='Nome em edição','cancel confirmation preserves draft');
  await page.evaluate(()=>{window.__failSave=true});
  await page.getByRole('button',{name:'Salvar perfil',exact:true}).click();
  await page.getByText('Falha simulada. Tente novamente.').waitFor();
  check(await page.getByLabel('Nome',{exact:true}).inputValue()==='Nome em edição','save failure preserves draft');
  await page.evaluate(()=>{window.__failSave=false});
  await page.getByRole('button',{name:'Salvar perfil',exact:true}).click();
  await page.getByRole('heading',{name:'Nome em edição',exact:true}).waitFor();assertions++;
  await page.getByRole('button',{name:'Editar perfil',exact:true}).click();
  await page.getByLabel('Bio',{exact:true}).fill('Texto ainda não salvo');
  await page.getByRole('button',{name:'Selecionar foto de teste',exact:true}).click();
  check(await page.getByRole('button',{name:'Salvar perfil',exact:true}).isDisabled(),'pending photo prevents silently lost selection');
  await page.getByRole('button',{name:'Usar esta foto',exact:true}).click();
  check(await page.getByLabel('Bio',{exact:true}).inputValue()==='Texto ainda não salvo','avatar refresh preserves bio');
  await page.screenshot({path:resolve(out,'profile-editor.png'),fullPage:true});
  for(const width of [320,390,430,1024]){await page.setViewportSize({width,height:900});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no editor overflow '+width)}
  await page.evaluate(()=>window.__switch());
  await page.getByRole('heading',{name:'Outra conta',exact:true}).waitFor();
  check(await page.locator('[data-testid="profile-editor"]').count()===0,'identity change discards former editor');
  check(await page.getByText('Texto ainda não salvo',{exact:true}).count()===0,'no former draft after identity change');
  check(errors.length===0,'no runtime errors or duplicate key warnings: '+errors.join(';'));
  const result=await page.evaluate(async()=>{const file=new File([await(await fetch('/fixture.heic')).blob()],'iphone.heic',{type:'image/heic'});const prepared=await window.preparePhoto(file);try{const crop=await window.renderCrop(prepared.url,{x:0,y:0,width:Math.min(prepared.width,prepared.height),height:Math.min(prepared.width,prepared.height)},0,512);return{width:prepared.width,height:prepared.height,size:crop.size,type:crop.type}}finally{URL.revokeObjectURL(prepared.url)}});
  check(result.width>0&&result.height>0,'real HEIC decoded');check(result.size>0&&result.size<=3*1024*1024&&result.type==='image/webp','HEIC passes existing crop and normalized upload budget');
  const cancelled=await page.evaluate(async()=>{const controller=new AbortController();controller.abort();try{await window.decodeHeic(new Blob(),controller.signal);return false}catch(error){return error.name==='AbortError'}});check(cancelled,'HEIC cancellation is explicit');
  console.log(JSON.stringify({assertions,result,scope:'Chromium emulation; mocked profile services; real HEIC decoder; no hosted or physical-device claims'}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

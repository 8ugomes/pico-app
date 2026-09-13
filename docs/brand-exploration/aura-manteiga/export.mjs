/** Export source SVGs and the single selected brand manual. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PICO_PLAYWRIGHT_PATH||'playwright');
const sharp=require('sharp');
const root=path.dirname(new URL(import.meta.url).pathname);
for(const[size,name]of [[16,'favicon-16'],[32,'favicon-32'],[192,'pico-192'],[512,'pico-512']])await sharp(path.join(root,'logo/pico-app.svg')).resize(size,size).png().toFile(path.join(root,'logo/'+name+'.png'));
for(const[size,name]of [[512,'pico-maskable-512'],[180,'apple-icon']])await sharp(path.join(root,'logo/pico-maskable-512.svg')).resize(size,size).png().toFile(path.join(root,'logo/'+name+'.png'));
for(const name of ['wordmark-cacau','wordmark-manteiga','lockup-cacau','lockup-manteiga'])await sharp(path.join(root,'logo/'+name+'.svg')).resize({width:1600}).png().toFile(path.join(root,'logo/'+name+'.png'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1060},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.PICO_BRAND_URL||'http://127.0.0.1:8765')+'/aura-manteiga/manual.html');
await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');
await page.evaluate(()=>document.documentElement.style.setProperty('--book-zoom',1));
const qa=await page.evaluate(()=>{const pages=[...document.querySelectorAll('.bm-page')];return{pages:pages.length,phones:document.querySelectorAll('.phone').length,missingImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),overflow:pages.flatMap((p,i)=>{const foot=p.querySelector('.bm-foot').getBoundingClientRect();const bad=[...p.querySelectorAll('.bm-block,.bm-table,.bm-palette,.bm-screen-note,.bm-icon-grid,.bm-app-layout,.bm-type-layout')].filter(el=>el.getBoundingClientRect().bottom>foot.top-10);return bad.map(el=>({page:i+1,kind:p.dataset.kind,element:el.className,bottom:Math.round(el.getBoundingClientRect().bottom-p.getBoundingClientRect().top),limit:Math.round(foot.top-p.getBoundingClientRect().top)}));})}});
qa.errors=errors;fs.writeFileSync(path.join(root,'render-qa.json'),JSON.stringify(qa,null,2)+'\n');
console.log(JSON.stringify(qa,null,2));
for(const kind of ['cover','logo','color','type','applications','screens-light-4','screens-dark-4'])await page.locator(`[data-kind="${kind}"]`).screenshot({path:path.join(root,`preview/${kind}.png`)});
for(const [id,name,w,h]of [['application-social','social-post',1080,1350],['application-story','story',1080,1920]]){
 const item=page.locator('#'+id);const size=await item.boundingBox();
 // Re-render the authored DOM at target raster density; photography bytes remain untouched.
 const c=await browser.newContext({viewport:{width:1440,height:1060},deviceScaleFactor:w/size.width});const p=await c.newPage();
 const markup=await item.evaluate(el=>el.outerHTML); const base=process.env.PICO_BRAND_URL||'http://127.0.0.1:8765';
 await p.goto(base+'/aura-manteiga/manual.html');
 await p.setContent(`<!doctype html><html><head><base href="${base}/"><link rel="stylesheet" href="gallery.css"><link rel="stylesheet" href="aura-manteiga/manual.css"></head><body class="brand-book">${markup}</body></html>`);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);
 if(!await p.evaluate(()=>document.fonts.check('700 36px Syne')&&document.fonts.check('400 16px Manrope')))throw Error('Application fonts failed to load');
 await p.locator('#'+id).screenshot({path:path.join(root,'applications/'+name+'.png')});await c.close();
 console.log('Application',name,w,h);
}
await page.emulateMedia({media:'print'});
const pdf=path.resolve(root,'../../..','output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf');
await page.pdf({path:pdf,width:'15in',height:'10.625in',printBackground:true,preferCSSPageSize:true,tagged:true});
await browser.close();
if(qa.errors.length||qa.missingImages.length||qa.overflow.length)process.exitCode=1;

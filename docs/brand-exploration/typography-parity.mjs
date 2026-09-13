/** Regression for report CSS leaking into the same phone UI. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PICO_PLAYWRIGHT_PATH||'playwright');
const base=process.env.PICO_BRAND_URL||'http://127.0.0.1:8765';
const root=path.dirname(new URL(import.meta.url).pathname);
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1020}});
const read=()=>{
  const out={};
  for(const phone of document.querySelectorAll('.parity-samples .phone,.report-page .phone')){
    const key=[...phone.classList].find(c=>['ritual','pulso','aura'].includes(c))+'/'+phone.dataset.mode+'/'+phone.dataset.screen;
    out[key]=[...phone.querySelectorAll('h1,h2,h3,p')].map(el=>{const s=getComputedStyle(el);return {tag:el.tagName,text:el.textContent.trim(),fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing};});
  }
  return out;
};
await page.goto(base);await page.evaluate(()=>document.fonts.ready);
await page.evaluate(()=>{
  const box=document.createElement('div');box.className='parity-samples';
  box.innerHTML=Object.keys(window.PicoBrand.concepts).flatMap(key=>['light','dark'].flatMap(mode=>window.PicoBrand.screens.map(([id])=>window.PicoBrand.renderPhone(key,mode,id)))).join('');
  document.body.append(box);
});
const gallery=await page.evaluate(read);
await page.goto(base+'/report.html');await page.evaluate(()=>document.fonts.ready);
const report=await page.evaluate(read);
const mismatches=[];
for(const [key,elements] of Object.entries(report))elements.forEach((el,i)=>{if(JSON.stringify(el)!==JSON.stringify(gallery[key]?.[i]))mismatches.push({key,index:i,report:el,gallery:gallery[key]?.[i]});});
const result={phonesCompared:Object.keys(report).length,textElementsCompared:Object.values(report).reduce((sum,els)=>sum+els.length,0),properties:['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'],mismatches};
fs.writeFileSync(path.join(root,'typography-parity.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));await browser.close();if(mismatches.length)process.exitCode=1;

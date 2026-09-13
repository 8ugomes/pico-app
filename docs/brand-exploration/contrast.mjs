import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PICO_PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1020}});
await page.goto(process.env.PICO_BRAND_URL||'http://127.0.0.1:8765');
await page.evaluate(()=>document.fonts.ready);
const out=await page.evaluate(()=>{
  const pairs=new Map(),tokens={};
  const lum=rgb=>rgb.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const rgba=str=>(str.match(/[\d.]+/g)||[]).map(Number);
  for(const mode of ['light','dark'])for(const key of Object.keys(window.PicoBrand.concepts))for(const [id] of window.PicoBrand.screens){
    const holder=document.createElement('div');holder.innerHTML=window.PicoBrand.renderPhone(key,mode,id);document.body.append(holder);const phone=holder.firstElementChild;
    const style=getComputedStyle(phone);tokens[key]??={};tokens[key][mode]=Object.fromEntries(['bg','surface','ink','muted','soft','line','brand','onbrand','focus','error','radius','display'].map(t=>[t,style.getPropertyValue('--'+t).trim()]));
    for(const el of phone.querySelectorAll('*')){
      if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||el.tagName==='OPTION')continue;
      const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
      const fg=rgba(cs.color);let ancestor=el,bg;
      while(ancestor){const values=rgba(getComputedStyle(ancestor).backgroundColor);if(values.length===3||values[3]===1){bg=values;break;}ancestor=ancestor.parentElement;}
      if(!bg||fg.length<3)continue;
      const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(cs.fontSize),weight=parseInt(cs.fontWeight);
      const required=size>=24||(size>=18.66&&weight>=700)?3:4.5;
      const k=[key,mode,fg.join(','),bg.join(','),required].join('|');
      if(!pairs.has(k))pairs.set(k,{concept:key,mode,foreground:cs.color,background:`rgb(${bg.slice(0,3).join(', ')})`,ratio:Math.round(ratio*100)/100,required,pass:ratio>=required,example:el.textContent.trim().slice(0,80),screen:id});
    }
    holder.remove();
  }
  return {tokens,pairs:[...pairs.values()],failures:[...pairs.values()].filter(p=>!p.pass)};
});
const root=path.dirname(new URL(import.meta.url).pathname);
fs.writeFileSync(path.join(root,'tokens.json'),JSON.stringify(out.tokens,null,2)+'\n');
fs.writeFileSync(path.join(root,'contrast-audit.json'),JSON.stringify({method:'Computed solid foreground/background text pairs. Excludes images, icons, boundaries, placeholder pseudo-elements and full accessibility conformance.',pairs:out.pairs,failures:out.failures},null,2)+'\n');
console.log(`${out.pairs.length} distinct text pairs; ${out.failures.length} failures.`);
await browser.close();if(out.failures.length)process.exitCode=1;

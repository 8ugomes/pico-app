/** Export the print layout and a compact set of reviewable previews. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PICO_PLAYWRIGHT_PATH||'playwright');
const base=process.env.PICO_BRAND_URL||'http://127.0.0.1:8765';
const root=path.dirname(new URL(import.meta.url).pathname);
for(const d of ['preview','.impeccable/review'])fs.mkdirSync(path.join(root,d),{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const ready=async()=>{await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');};
await page.goto(base);await ready();
await page.screenshot({path:path.join(root,'.impeccable/review/desktop.png'),fullPage:true});
await page.locator('.comparison').screenshot({path:path.join(root,'preview/feed-comparison.png')});
for(const key of ['ritual','pulso','aura']){
  await page.locator(`#direction-${key} .canonical-board`).screenshot({path:path.join(root,`preview/${key}-identity.png`)});
  await page.locator('.phone.'+key).screenshot({path:path.join(root,`preview/${key}-feed.png`)});
}
await page.locator('#screen-select').selectOption('welcome');
await page.locator('.comparison').screenshot({path:path.join(root,'preview/welcome-comparison.png')});
await page.locator('button[data-mode=dark]').click();
await page.locator('#screen-select').selectOption('games');
await page.locator('.comparison').screenshot({path:path.join(root,'preview/games-dark-comparison.png')});
await page.setViewportSize({width:390,height:844});
await page.goto(base+'/?screen=welcome&concept=ritual');await ready();
await page.screenshot({path:path.join(root,'.impeccable/review/mobile.png'),fullPage:true});
await page.setViewportSize({width:1440,height:1020});
await page.goto(base+'/report.html');await ready();
const selections=[[1,'cover'],[4,'comparison'],[6,'logos'],[7,'color-type'],[8,'art'],[13,'profiles'],[16,'states'],[17,'dark'],[19,'pulso-logos'],[20,'pulso-color'],[22,'pulso-screen-evidence'],[32,'aura-logos'],[33,'aura-color'],[34,'aura-art'],[35,'aura-screen-evidence'],[45,'recommendation']];
for(const [num,name] of selections)await page.locator('.report-page').nth(num-1).screenshot({path:path.join(root,`.impeccable/review/report-${name}.png`)});
await page.emulateMedia({media:'print'});
await page.pdf({path:path.join(root,'Pico-Social-Identidade.pdf'),width:'15in',height:'10.625in',printBackground:true,preferCSSPageSize:true,tagged:true});
console.log(`Exported ${await page.evaluate(()=>window.PicoReport.pageCount)} pages and previews.`);
await browser.close();

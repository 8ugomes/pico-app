/** Verify the static proposal without connecting to the production application. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const playwrightPath = process.env.PICO_PLAYWRIGHT_PATH || 'playwright';
const { chromium } = require(playwrightPath);
const base = process.env.PICO_BRAND_URL || 'http://127.0.0.1:8765';
const root = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1020 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await page.goto(base);
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');
const screenIds = await page.evaluate(() => window.PicoBrand.screens.map(s => s[0]));
const matrix = [];
for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 1020 });
  for (const mode of ['light', 'dark']) {
    await page.locator(`button[data-mode="${mode}"]`).click();
    for (const screen of screenIds) {
      await page.locator('#screen-select').selectOption(screen);
      const result = await page.evaluate(() => ({
        documentOverflow: document.documentElement.scrollWidth > innerWidth,
        phones: [...document.querySelectorAll('.phone')].map(p => ({
          concept: [...p.classList].find(x => ['ritual', 'pulso', 'aura'].includes(x)),
          width: p.clientWidth,
          overflow: p.querySelector('.scroll').scrollWidth > p.querySelector('.scroll').clientWidth + 1,
          imageFailures: [...p.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length,
          label: p.querySelector('.demo-strip')?.textContent,
        })),
      }));
      matrix.push({ width, mode, screen, ...result });
    }
  }
}
await page.setViewportSize({ width: 1440, height: 1020 });
await page.goto(base+'/?screen=feed');
await page.locator('.phone.ritual .bottom-nav [data-goto="profile"]').click();
await page.locator('.phone.ritual [data-goto="games"]').click();
const navigation = await page.locator('#screen-select').inputValue() === 'games';
await page.locator('.phone.ritual [data-goto="new-game"]').click();
await page.locator('.phone.ritual [data-demo]').last().click();
const honestAction = (await page.locator('#notice').innerText()).includes('nada foi salvo');
await page.goto(base+'/report.html');
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');
const report = await page.evaluate(() => ({
  pages: window.PicoReport.pageCount,
  phones: document.querySelectorAll('.report-page .phone').length,
  overflow: [...document.querySelectorAll('.report-page')].flatMap((p,i) => p.scrollHeight > p.clientHeight + 1 ? [{page:i+1,height:p.scrollHeight}] : []),
  footerOverlap: [...document.querySelectorAll('.report-page:not(.cover-page)')].flatMap((p,i) => {
    const footer=p.querySelector('.report-foot').getBoundingClientRect();
    return [...p.children].filter(el=>!el.classList.contains('report-foot')).flatMap(el=>el.getBoundingClientRect().bottom>footer.top-5?[{page:i+2,tag:el.tagName,bottom:el.getBoundingClientRect().bottom-footer.top}]:[]);
  }),
  images: [...document.images].filter(i => !i.complete || i.naturalWidth===0).map(i=>i.src),
}));
const failures=matrix.filter(r=>r.documentOverflow||r.phones.some(p=>p.overflow||p.imageFailures||!p.label));
const result={checkedAt:new Date().toISOString(),viewports:[320,390,768,1024,1440],screens:screenIds.length,modes:2,concepts:3,phoneChecks:matrix.length*3,errors,failures,navigation,honestAction,report};
fs.writeFileSync(path.join(root,'QA.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
await browser.close();
if(errors.length||failures.length||!navigation||!honestAction||report.overflow.length||report.footerOverlap.length||report.images.length)process.exitCode=1;

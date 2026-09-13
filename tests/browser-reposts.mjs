import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

export async function reviewReposts({ origin, actor, follower, publicId, privateId, check }) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const output = '.vercel/reposts-review', errors = [], layouts = [];
  async function session(account) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.addCookies([...account.jar].map(([name, value]) => ({ name, value, url: origin })));
    await context.addInitScript(id => {
      localStorage.setItem('pico.install-dismissed', '1');
      for (const identity of ['account:' + id]) localStorage.setItem('pico.tour.v1:' + identity, JSON.stringify({ version: 1, status: 'dismissed', step: 0 }));
    }, account.id);
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(12000);
    return { context, page };
  }
  try {
    const { context, page } = await session(actor);
    await page.goto(origin + '/publicacoes/' + publicId);
    const button = page.getByRole('button', { name: 'Republicar de Autora de teste', exact: true });
    await button.waitFor();
    await button.click();
    let dialog = page.getByRole('dialog', { name: 'Republicar?' });
    check((await dialog.innerText()).includes('quem acompanha você'), 'audience explained before action');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    check(await button.getAttribute('aria-pressed') === 'false', 'cancel does not repost');
    check(await button.evaluate(e => e === document.activeElement), 'dialog returns keyboard focus');
    let fail = true, requests = 0;
    await context.route('**/api/posts', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      requests++;
      if (fail) return route.fulfill({ status: 503, json: { message: 'Falha controlada. Tente novamente.' } });
      return route.continue();
    });
    await button.click();
    await dialog.getByRole('button', { name: 'Republicar', exact: true }).click();
    await dialog.getByRole('alert').waitFor();
    check(await button.getAttribute('aria-pressed') === 'false', 'failed request never reports success');
    fail = false;
    const before = requests;
    await dialog.getByRole('button', { name: 'Republicar', exact: true }).evaluate(e => { e.click(); e.click(); });
    await dialog.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Desfazer republicação de Autora de teste', exact: true }).waitFor();
    check(requests === before + 1, 'rapid double click sends once');
    await page.reload();
    check(await page.getByRole('button', { name: 'Desfazer republicação de Autora de teste', exact: true }).getAttribute('aria-pressed') === 'true', 'confirmed state survives reload');
    await page.goto(origin + '/perfil');
    await page.locator('.post-repost-attribution', { hasText: 'Você' }).waitFor();
    check(true, 'own profile contains repost with attribution');
    const receiving = await session(follower);
    await receiving.page.goto(origin + '/feed');
    await receiving.page.locator('.post-repost-attribution', { hasText: actor.name }).waitFor();
    check(true, 'follower receives repost in actual UI');
    await receiving.page.screenshot({ path: output + '/follower-feed-390.png', fullPage: true });
    await page.goto(origin + '/publicacoes/' + privateId);
    await page.getByRole('button', { name: 'Republicar de Autora de teste', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Republicar?' });
    check((await dialog.innerText()).includes('Só participantes do grupo privado'), 'private audience explained');
    for (const [theme, width, scale] of [['light',390,1], ['dark',320,1], ['light',320,2]]) {
      await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme: theme });
      await page.evaluate(async scale => { document.documentElement.style.fontSize = (16 * scale) + 'px'; await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }, scale);
      const layout = await page.evaluate(() => {
        const dialog = document.querySelector('dialog[open]');
        const controls = [...dialog.querySelectorAll('button')].map(e => { const b = e.getBoundingClientRect(); return { text: e.textContent, width: b.width, height: b.height }; });
        return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, dialogWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth, controls, overflow: [...document.querySelectorAll('body *')].filter(e => e.getClientRects().length && !e.closest('dialog')).map(e => ({tag: e.tagName, cls: e.className, right: e.getBoundingClientRect().right})).filter(e => e.right > innerWidth + 1).slice(0,15) };
      });
      await page.screenshot({ path: `${output}/private-dialog-${theme}-${width}-${scale}.png` });
      assert.ok(layout.documentWidth <= width + 1 && layout.dialogWidth <= layout.clientWidth + 1, 'no horizontal overflow: ' + JSON.stringify(layout));
      assert.ok(layout.controls.every(c => c.width >= 43 && c.height >= 43), 'touch controls at least 44px');
      layouts.push({ theme, scale, ...layout });
      await page.screenshot({ path: `${output}/private-dialog-${theme}-${width}-${scale}.png` });
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await dialog.getByRole('button', { name: 'Republicar', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Desfazer republicação de Autora de teste', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Desfazer republicação', exact: true }).click();
    await page.getByRole('button', { name: 'Republicar de Autora de teste', exact: true }).waitFor();
    check(true, 'private repost can be undone through UI');
    check(errors.length === 0, 'no browser JavaScript errors');
    writeFileSync(output + '/browser.json', JSON.stringify({ completed: true, layouts, errors }, null, 2));
  } finally { await browser.close(); }
}

// UI fixtures against the real Next app. Every API is intercepted; no accounts or remote writes.
// INSTALL_BASE_URL=http://localhost:3031 PLAYWRIGHT_MODULE=<path> PLAYWRIGHT_CHANNEL=chrome node tests/browser-install-guide.mjs
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const origin = process.env.INSTALL_BASE_URL || 'http://localhost:3031';
assert.equal(new URL(origin).hostname, 'localhost');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const output = 'docs/install-guide-review'; mkdirSync(output, { recursive: true });
mkdirSync('.impeccable/review', { recursive: true });
const checks = [], errors = [], writes = [];
const idA = '30000000-0000-4000-8000-000000000001', idB = '30000000-0000-4000-8000-000000000002';
let id = idA, profileReady = true, pending = false, welcomeError = false, ackError = false;
const version = process.env.PICO_BUILD_VERSION || execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
const sports = [{ id: '10000000-0000-4000-8000-000000000002', slug: 'beach-tennis', name: 'Beach Tennis' }];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1', reducedMotion: 'reduce', colorScheme: 'light' });
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) return route.abort();
  if (!url.pathname.startsWith('/api/')) return route.continue();
  const reply = (json, status = 200) => route.fulfill({ status, json });
  const profile = { id, username: 'pessoa_teste', name: 'Pessoa de teste', bio: '', city: 'São Paulo', neighborhood: '', isDemo: true, onboardingCompleted: profileReady, avatarPath: profileReady ? id + '/fixture.webp' : null, avatar: profileReady ? '/icons/pico-club-192.png' : null, sports: [{ sport: sports[0], level: 'Iniciante', isPrimary: true }] };
  if (url.pathname === '/api/version') return reply({ version });
  if (url.pathname === '/api/access') return reply({ admitted: true, signedIn: true });
  if (url.pathname === '/api/welcome') {
    const body = route.request().postDataJSON(); writes.push(body.action);
    if (body.action === 'acknowledge') { if (ackError) return reply({ message: 'Fixture failure' }, 503); pending = false; return reply({ data: null }); }
    if (welcomeError) return reply({ message: 'Fixture failure' }, 503);
    return reply({ data: { id: 'official-fixture', slug: 'pico', name: 'Comunidade oficial do Pico', pending } });
  }
  if (route.request().method() !== 'GET') throw new Error('Unexpected fixture write: ' + url.pathname);
  if (url.pathname === '/api/social/read') {
    const resource = url.searchParams.get('resource');
    return reply({ status: 'success', data: resource === 'profile' ? { kind: 'profile', profile } : resource === 'sports' ? { kind: 'sports', sports } : { kind: resource, players: [], arenas: [], sports, hasMore: false } });
  }
  if (url.pathname === '/api/posts') return reply({ data: url.searchParams.get('kind') === 'options' ? { arenas: [], communities: [] } : { posts: [], viewerId: id, hasMore: false } });
  if (url.pathname === '/api/activity') return reply({ data: { own: true, arenas: [], communities: [] } });
  return reply({ data: [] });
});
const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
await page.clock.install();
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
const invite = () => page.locator('.install-invitation');
const scene = () => page.locator('.install-phone').getAttribute('data-scene');
const tick = async (ms = 16000) => { await page.clock.runFor(ms); await page.evaluate(() => new Promise(resolve => queueMicrotask(resolve))); };
async function prepare(status, { clear = true } = {}) {
  await page.goto(origin + '/instalar'); await page.getByRole('button', { name: 'iPhone', exact: true }).waitFor();
  await page.evaluate(({ status, id, clear }) => { if (clear) localStorage.clear(); const key = 'pico.tour.v1:account:' + id; if (status) localStorage.setItem(key, JSON.stringify({ version: 1, status, step: 0 })); else localStorage.removeItem(key); }, { status, id, clear });
  await page.goto(origin + '/feed');
  await page.locator(profileReady ? '.feed-empty' : '[data-testid="profile-editor"]').waitFor();
  await tick(50);
}
async function shot(name, width = 390, colorScheme = 'light') {
  await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme });
  await page.clock.runFor(100); // Flush the paint after a viewport/theme change with the controlled clock.
  await page.evaluate(() => document.fonts.ready); await page.locator('.install-phone').waitFor();
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} fits ${width}px`);
  if (!process.env.INSTALL_SKIP_CAPTURES) await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
let completed = false;
try {
  await page.goto(origin + '/instalar'); await page.getByRole('button', { name: 'Reproduzir animação' }).waitFor();
  await tick(); check(await scene() === 'menu', 'reduced motion starts paused');
  await shot('ios-menu');
  await page.getByRole('button', { name: 'Próxima etapa' }).click();
  check(await scene() === 'share', 'manual control advances without autoplay');
  await shot('mobile');
  await page.getByRole('button', { name: 'Próxima etapa' }).focus(); await page.keyboard.press('Enter');
  check(await scene() === 'home-option', 'keyboard advances the guide');
  await shot('ios-share-dark', 320, 'dark');
  await page.getByRole('button', { name: 'Próxima etapa' }).click(); await shot('ios-web-app', 390, 'light');
  await page.getByRole('button', { name: 'Próxima etapa' }).click(); await shot('ios-confirm', 390, 'dark');
  await page.getByText('Meu Safari é diferente', { exact: true }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  check(await scene() === 'share' && await page.locator('.install-caption').innerText() === '1/5\nToque em Compartilhar', 'classic Safari starts at its share control');
  await page.getByRole('button', { name: 'Android', exact: true }).click();
  await page.getByRole('button', { name: 'Próxima etapa' }).click();
  await shot('desktop', 1280, 'light');
  await page.getByRole('button', { name: 'Próxima etapa' }).click();
  check(await scene() === 'web-app', 'Android explains install submenu');
  await page.getByRole('button', { name: 'Próxima etapa' }).click();
  await shot('android-confirm-dark', 390, 'dark');
  await page.getByRole('button', { name: 'Próxima etapa' }).click();
  check(await page.locator('.install-caption').innerText() === '5/5\nAssim fica na sua tela', 'last scene is an example, not a claim of installation');
  await shot('home', 390, 'light');
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'guide fits enlarged text');
  await page.evaluate(() => document.documentElement.style.fontSize = '');
  // Timed playback and pausing use real component effects with a controlled clock.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Rever animação' }).click();
  await tick(4300); check(await scene() === 'home-option', 'playback advances one scene');
  await page.getByRole('button', { name: 'Pausar animação' }).click();
  await tick(); check(await scene() === 'home-option', 'pause stops the timer');
  await page.getByRole('button', { name: 'Reproduzir animação' }).click();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.locator('.install-phone[data-playing=false]').waitFor(); await tick(); check(await scene() === 'home-option', 'hidden tab pauses playback');
  await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
  await page.locator('.install-phone[data-playing=true]').waitFor();
  await page.evaluate(() => { const spacer = document.createElement('div'); spacer.id = 'install-fixture-spacer'; spacer.style.height = '3000px'; document.body.append(spacer); scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }); });
  await page.locator('.install-phone[data-playing=false]').waitFor(); await tick(); check(await scene() === 'home-option', 'offscreen player pauses playback');
  await page.evaluate(() => { document.getElementById('install-fixture-spacer').remove(); document.querySelector('.install-player').scrollIntoView({ block: 'center', behavior: 'instant' }); });
  await page.locator('.install-phone[data-playing=true]').waitFor();
  for (let n = 0; n < 3; n++) await tick(4300);
  check(await scene() === 'home', 'autoplay stops on the last scene');
  await tick(); check(await scene() === 'home', 'no endless animation loop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Native prompt simulations never claim success on acceptance alone.
  for (const outcome of ['dismissed', 'accepted', 'error']) {
    await page.evaluate(outcome => { const event = new Event('beforeinstallprompt', { cancelable: true }); event.prompt = async () => { if (outcome === 'error') throw new Error('fixture'); }; event.userChoice = Promise.resolve({ outcome }); window.dispatchEvent(event); }, outcome);
    await page.getByRole('button', { name: 'Instalar Pico Club', exact: true }).click();
    await page.getByRole('status').waitFor();
    check(!(await page.getByText('Pico Club já está instalado.', { exact: true }).count()), `native ${outcome} does not fake installation`);
  }
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await page.getByText('Pico Club já está instalado.', { exact: true }).waitFor(); checks.push('appinstalled event confirms installation');
  check(await page.getByText('Não foi possível abrir a instalação. Siga as figuras abaixo.', { exact: true }).count() === 0, 'installation confirmation clears stale error');
  await page.setViewportSize({ width: 390, height: 844 });
  profileReady = false; await prepare('complete'); await tick(); check(await invite().count() === 0, 'incomplete profile blocks invitation');
  profileReady = true;
  for (const status of [null, 'active', 'paused']) { await prepare(status); await tick(); check(await invite().count() === 0, `${status ?? 'unknown'} tour blocks invitation`); }
  pending = true; await prepare('dismissed'); await tick(); check(await invite().count() === 0, 'pending official welcome blocks invitation');
  ackError = true; await page.getByRole('button', { name: 'Entendi', exact: true }).click(); await tick(); check(await invite().count() === 0, 'failed welcome acknowledgment blocks invitation');
  ackError = false; await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await page.locator('.official-welcome').waitFor({ state: 'hidden' });
  await tick(14000); check(await invite().count() === 0, 'no invitation immediately after final acknowledgment');
  await tick(1100); await invite().waitFor(); checks.push('invitation appears only after settled journey and idle delay');
  check(await page.locator('dialog[open]').count() === 0, 'invitation never opens a modal');
  await invite().evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.screenshot({ path: output + '/invitation.png', fullPage: false });
  await invite().getByRole('button', { name: 'Agora não' }).click();
  await page.reload(); await tick(); check(await invite().count() === 0, 'dismissal persists after reload');
  id = idB; await prepare('complete', { clear: false }); await tick(); await invite().waitFor(); checks.push('invitation preference is isolated between accounts');
  await invite().getByRole('link', { name: 'Ver como' }).click(); await page.waitForURL('**/instalar');
  await page.getByRole('link', { name: 'Voltar ao Pico' }).click(); await page.waitForURL('**/feed'); await tick(); check(await invite().count() === 0, 'opening the guide prevents repeated invitations');
  welcomeError = true; await prepare('complete'); await tick(); check(await invite().count() === 0, 'unknown welcome state blocks invitation'); welcomeError = false;
  await prepare('complete');
  await page.evaluate(() => { const dialog = document.createElement('dialog'); dialog.id = 'install-fixture-dialog'; document.body.append(dialog); dialog.showModal(); });
  await tick(); check(await invite().count() === 0, 'open modal delays invitation');
  await page.evaluate(() => document.getElementById('install-fixture-dialog').remove());
  await tick(); await invite().waitFor(); checks.push('closing modal starts a fresh quiet interval');
  await prepare('complete');
  await page.evaluate(() => { const input = document.createElement('input'); input.id = 'install-fixture-input'; document.body.append(input); input.focus(); });
  await tick(); check(await invite().count() === 0, 'focused form field delays invitation');
  await page.evaluate(() => document.getElementById('install-fixture-input').remove());
  await tick(); await invite().waitFor(); checks.push('leaving a field allows a fresh quiet interval');
  await prepare('complete'); await context.setOffline(true); await tick(); check(await invite().count() === 0, 'offline blocks invitation'); await context.setOffline(false);
  await prepare('complete'); await page.evaluate(() => { Object.defineProperty(navigator, 'standalone', { configurable: true, value: true }); window.dispatchEvent(new Event('appinstalled')); }); await tick(); check(await invite().count() === 0, 'installed app does not offer installation');
  await page.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { value: 'iPhone Instagram' }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied fixture'); } } }); });
  await page.goto(origin + '/instalar'); await page.getByRole('button', { name: 'Copiar link', exact: true }).click();
  await page.getByLabel('Link do Pico para copiar', { exact: true }).waitFor();
  check(await page.getByLabel('Link do Pico para copiar', { exact: true }).inputValue() === origin + '/feed', 'embedded browser has safe copy fallback without query tokens');
  assert.deepEqual(errors, []); completed = true;
} catch (error) { await page.screenshot({ path: '.vercel/install-failure.png', fullPage: true }); console.error((await page.locator('body').innerText()).slice(-2200)); console.error(await page.evaluate(() => ({ storage: { ...localStorage }, visibility: document.visibilityState, online: navigator.onLine, active: document.activeElement?.tagName, blockers: [...document.querySelectorAll('dialog[open], [role=dialog], [role=menu], [data-testid=profile-editor]')].map(e => e.outerHTML.slice(0, 200)) })));  throw error; }
finally { await browser.close(); writeFileSync(output + '/results.json', JSON.stringify({ completed, fixtureOnly: true, checks, runtimeErrors: errors, welcomeActions: writes }, null, 2) + '\n'); }
console.log(JSON.stringify({ completed, checks: checks.length, runtimeErrors: errors.length }));

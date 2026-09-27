import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('cliente iOS mantém credenciais fora de storage web e usa o plugin seguro', async () => {
  const [api, native] = await Promise.all([
    read('apps/mobile/api.ts'),
    read('apps/mobile/native.ts'),
  ]);
  const source = `${api}\n${native}`;
  assert.doesNotMatch(source, /localStorage|sessionStorage|@capacitor\/preferences|\bPreferences\b/);
  assert.match(native, /registerPlugin<SecureSessionPlugin>\('PicoSecureSession'\)/);
  assert.match(native, /saveRefreshToken/);
  assert.match(native, /readRefreshToken/);
  assert.match(native, /clearRefreshToken/);
  assert.match(api, /#accessToken: string \| null/);
  assert.match(api, /#refreshing: \{ generation: number; promise: Promise<boolean> \} \| null/);
  assert.match(api, /#sessionGeneration = new SessionGeneration\(\)/);
  assert.match(api, /#pendingAccepts = new Set<Promise<boolean>>/);
});

test('cliente móvel usa Bearer, omite cookies e limita a repetição após 401', async () => {
  const api = await read('apps/mobile/api.ts');
  assert.match(api, /headers\.set\('Authorization', `Bearer \$\{accessToken\}`\)/);
  assert.match(api, /credentials: 'omit'/);
  assert.match(api, /response\.status === 401 && retry401 && await this\.refresh\(\)/);
  assert.match(api, /this\.request<T>\(path, init, false\)/);
  assert.match(api, /action: 'sign_out'[\s\S]*headers: \{ 'Content-Type': 'application\/json' \}/);
  assert.match(api, /async signOut\(\)[\s\S]*#invalidateSession\(\)[\s\S]*#clearInvalidatedSession\(accountId, true, notice\)/);
  assert.match(api, /Não foi possível confirmar a revogação remota/);
  assert.match(api, /window\.dispatchEvent\(new CustomEvent\('pico:session-ended', \{ detail: \{ notice: localNotice \} \}\)\)/);
  assert.match(api, /markSessionClearPending\(\)/);
  assert.match(api, /readSessionClearPending\(\)/);
  assert.match(api, /#requireGeneration\(generation\)/);
  assert.match(api, /code: cancelled \? 'request_cancelled' : 'network_unavailable'[\s\S]*Não foi possível conectar agora/);
  assert.match(api, /window\.setTimeout\(\(\) => timeout\.abort\(\), 30_000\)/);
  assert.match(api, /code: cancelled \? 'request_cancelled'/);
  assert.match(api, /await clearRefreshToken\(\)/);
  assert.match(api, /clearAccountLocalContent\(accountId\)[\s\S]*clearSessionClearPending\(\)/);
});

test('cliente móvel cobre navegação principal, lifecycle e mídia privada autenticada', async () => {
  const [app, api, native, screens, accountRoute] = await Promise.all([
    read('apps/mobile/app.tsx'),
    read('apps/mobile/api.ts'),
    read('apps/mobile/native.ts'),
    read('apps/mobile/screens.tsx'),
    read('src/app/api/mobile/v1/account/route.ts'),
  ]);
  for (const label of ['Início', 'Pessoas', 'Comunidades', 'Arenas', 'Perfil']) assert.match(app, new RegExp(`label="${label}"`));
  assert.match(app, /onAppStateChange/);
  assert.match(app, /loadProfile\(\)\.finally\(\(\) => setPrivacyValidation/);
  assert.match(app, /requestAnimationFrame\(\(\) => void releasePrivacyCover\(\)\)/);
  assert.match(app, /onNetworkChange/);
  assert.match(native, /keyboardWillShow/);
  assert.match(native, /SplashScreen\.hide/);
  assert.match(native, /StatusBar\.setStyle/);
  assert.match(app, /setStatusBarContrast/);
  assert.match(app, /state\.status === 'signed_out' \|\| state\.status === 'guest'/);
  assert.match(api, /async privateMedia/);
  assert.match(api, /async playVideo/);
  assert.match(native, /registerPlugin<VideoPlayerPlugin>\('PicoVideoPlayer'\)/);
  assert.match(api, /const blob = await response\.blob\(\);[\s\S]*return blob/);
  assert.match(screens, /\/account\/export/);
  assert.match(screens, /method: 'DELETE'/);
  assert.match(screens, /confirmation/);
  assert.match(screens, /action: 'delete_post'/);
  assert.match(screens, /<ReportsPanel reports=\{account\.data\.reports\}/);
  assert.match(screens, /<AccountMedia media=\{account\.data\.media\}/);
  assert.match(screens, /removeMobileVideo\(item\.path\)/);
  assert.match(app, /api\.request<\{ deletionPending: boolean; accessStatus: AccountAccessStatus \}>\('\/account'\)/);
  assert.match(app, /status: 'deletion_pending'/);
  assert.match(app, /status: 'restricted'/);
  assert.match(app, /<AccountRightsScreen accessStatus=/);
  assert.match(app, /<ProfileSetup profile=\{state\.profile\} onAccount=/);
  assert.match(app, /Concluir exclusão/);
  assert.match(accountRoute, /export async function GET/);
  assert.match(accountRoute, /rpc\('mobile_account_access_state'\)/);
});

test('fim de sessão preserva aviso global e ignora respostas autenticadas tardias', async () => {
  const [api, app, auth] = await Promise.all([
    read('apps/mobile/api.ts'),
    read('apps/mobile/app.tsx'),
    read('apps/mobile/auth.tsx'),
  ]);
  assert.match(api, /const generation = this\.#sessionGeneration\.capture\(\);[\s\S]*this\.#requireGeneration\(generation\)/);
  assert.match(app, /event instanceof CustomEvent[\s\S]*event\.detail\?\.notice/);
  assert.match(app, /<AuthScreen notice=\{state\.notice\}/);
  assert.match(auth, /notice && <Notice tone="warning">\{notice\}<\/Notice>/);
  assert.match(app, /cause\.code === 'session_ended'\) return/);
});

test('visita anônima é informativa, não chama API autenticada e telas nomeiam seus títulos', async () => {
  const [auth, app, screens, ui] = await Promise.all([
    read('apps/mobile/auth.tsx'),
    read('apps/mobile/app.tsx'),
    read('apps/mobile/screens.tsx'),
    read('apps/mobile/ui.tsx'),
  ]);
  const guest = auth.slice(auth.indexOf('export function GuestScreen'), auth.indexOf('export function PicoMark'));
  assert.match(guest, /VISITA SEM CONTA/);
  assert.match(guest, /somente informativa/);
  assert.doesNotMatch(guest, /api\.|api\/mobile|request\(/);
  assert.match(app, /status: 'guest'/);
  for (const id of ['home-title', 'people-title', 'communities-title', 'arenas-title', 'profile-title']) {
    assert.match(screens, new RegExp(`<ScreenHeading id="${id}"`));
  }
  assert.doesNotMatch(screens, /prepara um arquivo|Preparar arquivo|Baixar meus dados/);
  assert.match(ui, /Rascunhos de publicação, perfil e jogo ficam guardados neste aparelho/);
});

test('cliente móvel respeita Dynamic Type e preferência por movimento reduzido', async () => {
  const styles = await read('apps/mobile/styles.css');
  assert.match(styles, /html \{[^}]*font: -apple-system-body[^}]*font-family: var\(--font-body\)/s);
  assert.match(styles, /--tab-height: [\d.]+rem/);
  assert.match(styles, /\.form-actions \{[^}]*flex-wrap: wrap/s);
  assert.match(styles, /\.post > footer \{[^}]*flex-wrap: wrap/s);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('cliente móvel associa ajuda aos campos e nomeia ações sociais', async () => {
  const [ui, screens, socialActions] = await Promise.all([
    read('apps/mobile/ui.tsx'),
    read('apps/mobile/screens.tsx'),
    read('apps/mobile/social-actions.tsx'),
  ]);
  assert.match(ui, /cloneElement/);
  assert.match(ui, /'aria-describedby'/);
  assert.match(screens, /aria-label=\{liked \? 'Descurtir publicação' : 'Curtir publicação'\}/);
  assert.match(screens, /<CommentsAction postId=\{post\.id\}/);
  assert.match(socialActions, /aria-label=\{`\$\{displayCount\} \$\{displayCount === 1 \? 'comentário' : 'comentários'\} na publicação de \$\{author\}`\}/);
});

test('feedback de comunidade distingue sucesso de falha', async () => {
  const screens = await read('apps/mobile/screens.tsx');
  const communityRow = screens.slice(screens.indexOf('function CommunityRow'), screens.indexOf('export function ArenasScreen'));
  assert.match(communityRow, /catch \(cause\) \{ setError\(errorMessage\(cause\)\); \}/);
  assert.match(communityRow, /message && <Notice tone="success">\{message\}<\/Notice>/);
  assert.match(communityRow, /error && <ErrorState message=\{error\} \/>/);
});

test('botão destrutivo mantém contraste nos dois temas', async () => {
  const styles = await read('apps/mobile/styles.css');
  const backgrounds = [...styles.matchAll(/--error: (#[0-9a-f]{6});/gi)].map((match) => match[1]);
  const foregrounds = [...styles.matchAll(/--error-ink: (#[0-9a-f]{6});/gi)].map((match) => match[1]);
  assert.equal(backgrounds.length, 2);
  assert.equal(foregrounds.length, 2);
  for (let index = 0; index < 2; index += 1) {
    assert.ok(contrastRatio(backgrounds[index], foregrounds[index]) >= 4.5);
  }
  assert.match(styles, /\.button-danger \{ color: var\(--error-ink\); background: var\(--error\); \}/);
});

function contrastRatio(first, second) {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
    const [red, green, blue] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
  };
  const [bright, dark] = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (bright + 0.05) / (dark + 0.05);
}

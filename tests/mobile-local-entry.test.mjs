import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('entrada oferece modo só neste iPhone sem depender da API', async () => {
  const [app, auth, api] = await Promise.all([
    read('apps/mobile/app.tsx'),
    read('apps/mobile/auth.tsx'),
    read('apps/mobile/api.ts'),
  ]);

  assert.match(auth, /Usar só neste iPhone/);
  assert.match(auth, /onLocal/);
  assert.match(app, /localRepository\.isPreferred\(\)/);
  assert.match(app, /status: 'local'/);
  assert.match(app, /<LocalModeApp/);
  assert.ok(app.indexOf('localRepository.isPreferred()') < app.indexOf('api.restore()'));
  assert.ok(app.indexOf("setState({ status: 'signed_out' })") < app.indexOf('const restored = await api.restore()'));
  assert.match(app, /connectedAttemptRef/);
  assert.match(app, /await api\.cancelPendingRestore\(\)/);
  assert.match(api, /async cancelPendingRestore\(\)[\s\S]*#invalidateSession\(\)[\s\S]*Promise\.allSettled\(pendingAccepts\)/);
  assert.match(api, /async signIn[\s\S]*await this\.cancelPendingRestore\(\)/);
  assert.match(api, /async signUp[\s\S]*await this\.cancelPendingRestore\(\)/);
  assert.match(auth, /onAuthenticationStart\(\)[\s\S]*api\.(?:signUp|signIn)/);
  assert.match(app, /onAuthenticationStart=\{\(\) => \{ connectedAttemptRef\.current \+= 1; \}\}/);
});

test('aplicativo local não importa cliente de API nem configuração remota', async () => {
  const localApp = await read('apps/mobile/local-app.tsx');

  assert.doesNotMatch(localApp, /from ['"]\.\/api['"]/);
  assert.doesNotMatch(localApp, /mobileConfig|api\.(?:request|publicRequest|restore)/);
  for (const label of ['Início', 'Jogos', 'Arenas', 'Perfil', 'Só neste iPhone']) {
    assert.match(localApp, new RegExp(label));
  }
});

test('histórico local continua operável quando a última arena é apagada', async () => {
  const localApp = await read('apps/mobile/local-app.tsx');
  const gamesScreen = localApp.slice(localApp.indexOf('function LocalGames'), localApp.indexOf('function GameEditor'));

  assert.match(gamesScreen, /workspace\.arenas\.length === 0 &&/);
  assert.match(gamesScreen, /games\.length === 0[\s\S]*local-game-list/);
  assert.match(gamesScreen, /Seu histórico continua disponível abaixo, inclusive para editar ou excluir/);
  assert.match(gamesScreen, /disabled=\{busy \|\| workspace\.arenas\.length === 0\}/);
});

test('falha ao ler o espaço local preserva o arquivo e oferece saída não destrutiva', async () => {
  const app = await read('apps/mobile/app.tsx');

  assert.match(app, /status: 'local_error'/);
  assert.match(app, /Sair do modo local/);
  assert.match(app, /Seus dados locais foram preservados neste iPhone/);
  assert.match(app, /code === 'corrupt'/);
  assert.match(app, /Digite APAGAR para confirmar/);
  assert.match(app, /onRetry=\{\(\) => void enterLocal\(\)\}/);
  assert.ok(app.indexOf('const workspace = await localRepository.load()') < app.indexOf('await localRepository.prefer()'));
  assert.match(app, /statusRef\.current === 'local' \|\| statusRef\.current === 'local_error'/);
  assert.match(app, /confirmationTrigger = useRef<HTMLButtonElement>\(null\)/);
  assert.match(app, /confirmationWasOpen\.current[\s\S]*confirmationTrigger\.current\?\.focus/);
});

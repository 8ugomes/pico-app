import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createId } from '../apps/mobile/id.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('cliente empacotado não depende de APIs ausentes no início do iOS 15', async () => {
  const files = await Promise.all([
    read('apps/mobile/attempts.ts'),
    read('apps/mobile/screens.tsx'),
    read('apps/mobile/ui.tsx'),
  ]);
  const source = files.join('\n');

  assert.doesNotMatch(source, /crypto\.randomUUID\(/);
  assert.doesNotMatch(source, /\.at\(-1\)/);
  assert.match(await read('apps/mobile/id.ts'), /crypto\.getRandomValues/);
});

test('gerador de ID mantém UUID v4 quando randomUUID não existe', () => {
  const original = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues(bytes) {
        bytes.fill(0x2a);
        return bytes;
      },
    },
  });
  try {
    assert.equal(createId(), '2a2a2a2a-2a2a-4a2a-aa2a-2a2a2a2a2a2a');
  } finally {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: original });
  }
});

test('CSS móvel oferece fallback antes de color-mix', async () => {
  const styles = await read('apps/mobile/styles.css');

  assert.match(styles, /\.app-header \{[^}]*background: var\(--background\);[^}]*background: color-mix/s);
  assert.match(styles, /\.tab-bar \{[^}]*background: var\(--surface\);[^}]*background: color-mix/s);
  assert.match(styles, /\.modal-sheet > header \{[^}]*background: var\(--raised\);[^}]*background: color-mix/s);
});

test('CSS móvel oferece fallback de viewport para todo uso de svh', async () => {
  const styles = await read('apps/mobile/styles.css');
  const declarations = [...styles.matchAll(/(?<property>min-height|max-height):\s*(?<value>[^;{}]*svh[^;{}]*);/g)];

  assert.ok(declarations.length > 0, 'o cliente deve continuar usando a unidade de viewport estável quando disponível');
  for (const declaration of declarations) {
    const property = declaration.groups?.property;
    const value = declaration.groups?.value;
    assert.ok(property && value && declaration.index !== undefined);
    const ruleStart = styles.lastIndexOf('{', declaration.index);
    const declarationsBefore = styles.slice(ruleStart + 1, declaration.index);
    const fallback = `${property}: ${value.replaceAll('svh', 'vh')};`;
    assert.ok(declarationsBefore.includes(fallback), `${declaration[0]} precisa vir depois de ${fallback}`);
  }

  assert.match(styles, /\.modal-sheet \{[^}]*max-height: 94vh;[^}]*max-height: 94svh;/s);
  assert.match(await read('native-shell/native-error.css'), /body\{min-height:100vh;min-height:100dvh;/);
});

test('listeners nativos registram uma vez e descartam handles que chegam depois do cleanup', async () => {
  const app = await read('apps/mobile/app.tsx');

  assert.match(app, /const statusRef = useRef<AppState\['status'\]>/);
  assert.match(app, /statusRef\.current = state\.status/);
  assert.match(app, /function retainHandle[\s\S]*if \(disposed\)[\s\S]*handle\.remove\(\)/);
  assert.match(app, /bindKeyboardState\(\)[\s\S]*if \(disposed\)[\s\S]*release\(\)/);
  assert.match(app, /}, \[loadProfile, openUrl\]\);/);
});

test('troca de aba local leva o foco do VoiceOver ao novo título', async () => {
  const localApp = await read('apps/mobile/local-app.tsx');

  assert.match(localApp, /previousTab = useRef<LocalTab \| null>\(null\)/);
  assert.match(localApp, /useLayoutEffect\(\(\) => \{[\s\S]*querySelector<HTMLElement>\('h1'\)[\s\S]*\.focus\(\{ preventScroll: true \}\)[\s\S]*}, \[tab\]\)/);
  assert.doesNotMatch(localApp, /previousTab[\s\S]*requestAnimationFrame/);
  assert.equal([...localApp.matchAll(/<h1[^>]*tabIndex=\{-1\}/g)].length, 4);
});

test('ações locais repetidas têm nomes acessíveis com contexto', async () => {
  const localApp = await read('apps/mobile/local-app.tsx');

  assert.match(localApp, /aria-label=\{`Editar jogo de \$\{dateLabel\(game\.playedOn\)\} em \$\{game\.arenaSnapshot\}`\}/);
  assert.match(localApp, /aria-label=\{`Excluir jogo de \$\{dateLabel\(game\.playedOn\)\} em \$\{game\.arenaSnapshot\}`\}/);
  assert.match(localApp, /aria-label=\{`Editar arena \$\{arena\.name\}`\}/);
  assert.match(localApp, /aria-label=\{`Excluir arena \$\{arena\.name\}`\}/);
  assert.doesNotMatch(localApp, /precisar(?:á|ão) de outro lugar para ser editad/);
});

test('modal prioriza autofocus e recupera um destino sobrevivente após exclusão', async () => {
  const ui = await read('apps/mobile/ui.tsx');

  assert.match(ui, /querySelector<HTMLElement>\('\[autofocus\]'\)/);
  assert.ok(ui.indexOf("querySelector<HTMLElement>('[autofocus]')") < ui.indexOf("querySelector<HTMLElement>('input:not(:disabled)"));
  assert.match(ui, /previous\?\.isConnected/);
  assert.match(ui, /#main-content h1\[tabindex\], #main-content\[tabindex\]/);
});

test('estilos locais não limitam Dynamic Type com tetos fixos em pixels', async () => {
  const styles = await read('apps/mobile/styles.css');
  const localStyles = styles.slice(styles.indexOf('.local-setup'), styles.indexOf('.modal-open'));

  assert.doesNotMatch(localStyles, /min\(\s*[\d.]+rem\s*,\s*[\d.]+px\s*\)/);
  assert.match(localStyles, /\.local-mode-badge \{[^}]*flex-wrap: wrap[^}]*text-align: right/s);
});

test('editor local não bloqueia a data persistida quando o relógio recua', async () => {
  const localApp = await read('apps/mobile/local-app.tsx');

  assert.match(localApp, /const maximumPlayedOn = game\?\.playedOn && game\.playedOn > today \? game\.playedOn : today/);
  assert.match(localApp, /<input type="date"[^>]*max=\{maximumPlayedOn\}/);
});

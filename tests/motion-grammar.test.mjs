import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => readFile(join(root, path), 'utf8');

async function cssFiles() {
  const files = ['apps/mobile/styles.css'];
  for (const name of await readdir(join(root, 'src/app'))) if (name.endsWith('.css')) files.push(`src/app/${name}`);
  return files;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every `transition`/`animation` declaration with its value (shorthand or longhand). */
function motionDeclarations(css) {
  return [...stripComments(css).matchAll(/(?:^|[;{\s])((?:transition|animation)(?:-duration|-timing-function|-delay)?)\s*:\s*([^;}]+)/g)]
    .map((match) => ({ property: match[1], value: match[2].trim() }));
}

const durationToken = /^var\(--motion-(fast|standard|brand|spin|shimmer|demo)\)$/;

test('tokens de movimento existem nos dois CSS com os valores de DESIGN.md', async () => {
  for (const file of ['apps/mobile/styles.css', 'src/app/globals.css']) {
    const css = await read(file);
    assert.match(css, /--motion-fast:\s*160ms;/, file);
    assert.match(css, /--motion-standard:\s*220ms;/, file);
    assert.match(css, /--motion-brand:\s*280ms;/, file);
    assert.match(css, /--motion-ease:\s*cubic-bezier\(\.22,\s*1,\s*\.36,\s*1\);/, file);
    assert.match(css, /--motion-stagger:\s*40ms;/, file);
  }
});

test('nenhuma duração ou curva de movimento fica fora dos tokens', async () => {
  for (const file of await cssFiles()) {
    const css = stripComments(await read(file));
    // A curva só pode ser escrita na definição do token.
    const curves = [...css.matchAll(/cubic-bezier\([^)]*\)/g)];
    assert.ok(curves.length <= (file === 'apps/mobile/styles.css' || file.endsWith('globals.css') ? 1 : 0), `${file}: curva fora do token`);
    // Palavras-chave de easing soltas.
    assert.doesNotMatch(css, /(?<![\w-])(ease-in-out|ease-in|ease-out|ease)(?![\w-])/, `${file}: easing solto; use var(--motion-ease)`);
    // Durações literais em declarações de movimento.
    for (const { property, value } of motionDeclarations(css)) {
      if (/^none$|^0s$|^0$/.test(value) || /^none\s*!important$/.test(value)) continue;
      if (property === 'animation-name') continue;
      assert.doesNotMatch(value.replace(/var\(--motion-[a-z]+\)/g, ''), /(?<![\w.-])\d*\.?\d+m?s\b/, `${file}: duração literal em "${property}: ${value}"`);
    }
    // Nenhum `transition: all`.
    assert.doesNotMatch(css, /transition\s*:\s*all\b/, `${file}: transition: all`);
  }
});

test('tokens de duração usados existem e a curva é sempre o token', async () => {
  const mobile = await read('apps/mobile/styles.css');
  for (const { value } of motionDeclarations(mobile)) {
    for (const token of value.matchAll(/var\((--motion-[a-z]+)\)/g)) {
      assert.match(mobile, new RegExp(`${token[1]}:`), `token ${token[1]} sem definição`);
    }
  }
  assert.ok(durationToken.test('var(--motion-fast)'));
});

test('movimento reduzido é a última regra do CSS móvel e zera animação e transição', async () => {
  const css = stripComments(await read('apps/mobile/styles.css')).trim();
  const last = css.lastIndexOf('@media (prefers-reduced-motion: reduce)');
  assert.ok(last > 0, 'bloco de movimento reduzido ausente');
  const block = css.slice(last);
  assert.match(block, /animation:\s*none\s*!important/);
  assert.match(block, /transition:\s*none\s*!important/);
  assert.match(block, /scroll-behavior:\s*auto\s*!important/);
  assert.equal(block.match(/\{/g)?.length, block.match(/\}/g)?.length, 'bloco deve ser o último e estar balanceado');
  // Nada depois do bloco, e nenhuma declaração de movimento depois dele.
  const afterOpening = block.slice(block.indexOf('{') + 1);
  const depth = [...afterOpening].reduce((level, character) => level + (character === '{' ? 1 : character === '}' ? -1 : 0), 1);
  assert.equal(depth, 0, 'conteúdo extra depois do bloco de movimento reduzido');
});

test('PWA mantém a regra universal de movimento reduzido', async () => {
  const css = stripComments(await read('src/app/globals.css'));
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[^]*?\*,\s*\*::before,\s*\*::after\s*\{[^}]*animation:\s*none\s*!important;[^}]*transition:\s*none\s*!important/);
});

test('folha e diálogo móveis têm saída, inércia durante a saída e desmontagem segura', async () => {
  const ui = await read('apps/mobile/ui.tsx');
  const css = stripComments(await read('apps/mobile/styles.css'));
  assert.match(ui, /data-state=\{open \? 'open' : 'closing'\}/);
  assert.match(ui, /inert=\{!open \|\| undefined\}/);
  assert.match(ui, /if \(!open && exited\) return null;/);
  assert.match(ui, /onAnimationEnd=/);
  assert.match(ui, /prefersReducedMotion\(\)/);
  assert.match(ui, /EXIT_SAFETY_MS/);
  // Fundo clicado durante a saída não fecha de novo.
  assert.match(ui, /if \(open && event\.currentTarget === event\.target\) onClose\(\)/);
  assert.match(css, /\.modal-layer\[data-state="closing"\][^{]*\{[^}]*pointer-events:\s*none[^}]*animation:\s*scrim-out var\(--motion-standard\) var\(--motion-ease\) forwards/);
  assert.match(css, /\.modal-layer\[data-state="closing"\] > \.modal-sheet \{[^}]*animation:\s*sheet-out var\(--motion-standard\)/);
});

test('o tempo de segurança da saída cobre a duração padrão', async () => {
  const { EXIT_SAFETY_MS, prefersReducedMotion } = await import('../apps/mobile/motion.ts');
  assert.ok(EXIT_SAFETY_MS > 220 && EXIT_SAFETY_MS <= 600);
  assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: true }) }), true);
  assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: false }) }), false);
  assert.equal(prefersReducedMotion({}), false);
});

test('entrada de listas escalona só os primeiros itens e não deixa preenchimento final', async () => {
  const css = stripComments(await read('apps/mobile/styles.css'));
  assert.match(css, /--item-index: 0; animation: item-in var\(--motion-standard\) var\(--motion-ease\) backwards; animation-delay: calc\(var\(--item-index\) \* var\(--motion-stagger\)\)/);
  assert.match(css, /:nth-child\(n\+5\) \{ --item-index: 4; \}/);
  assert.doesNotMatch(css.match(/item-in var[^;]*;/)?.[0] ?? '', /forwards|both/);
});

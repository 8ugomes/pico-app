import { readFileSync } from 'node:fs';
import { copyFile, mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

export const DEFAULT_MOBILE_API_ORIGIN = 'https://pico-app-sepia.vercel.app';
export const DEFAULT_MOBILE_CLIENT_VERSION = '1.0.0';

const environments = JSON.parse(
  readFileSync(new URL('../config/environments.json', import.meta.url), 'utf8'),
);
const betaSupabase = new URL(environments.beta.url);
export const DEFAULT_MOBILE_STORAGE_ORIGIN = `${betaSupabase.protocol}//${betaSupabase.hostname.replace(/\.supabase\.co$/, '.storage.supabase.co')}`;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDirectory, '..');

/**
 * Resolve the only two values that may be embedded in the packaged client.
 * No environment object is serialized into the output.
 *
 * @param {Record<string, string | undefined>} environment
 */
export function createMobileBuildSettings(environment = process.env) {
  const rawOrigin = environment.PICO_MOBILE_API_ORIGIN?.trim() || DEFAULT_MOBILE_API_ORIGIN;
  const rawStorageOrigin = environment.PICO_MOBILE_STORAGE_ORIGIN?.trim() || DEFAULT_MOBILE_STORAGE_ORIGIN;
  const clientVersion = environment.PICO_MOBILE_CLIENT_VERSION?.trim() || DEFAULT_MOBILE_CLIENT_VERSION;
  const mode = environment.PICO_MOBILE_BUILD_MODE?.trim() || 'production';

  let parsed;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    throw new Error('A origem da API móvel é inválida e precisa ser uma origem HTTPS.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('A origem da API móvel precisa usar HTTPS.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('A origem da API móvel não pode conter credenciais.');
  }
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('A origem da API móvel não pode conter caminho, consulta ou fragmento.');
  }
  let storage;
  try {
    storage = new URL(rawStorageOrigin);
  } catch {
    throw new Error('A origem do Storage móvel é inválida e precisa ser uma origem HTTPS direta do Supabase.');
  }
  if (
    storage.protocol !== 'https:'
    || !/^[a-z0-9][a-z0-9-]{2,62}\.storage\.supabase\.co$/.test(storage.hostname)
    || storage.port
    || storage.username
    || storage.password
    || storage.pathname !== '/'
    || storage.search
    || storage.hash
  ) {
    throw new Error('A origem do Storage móvel é inválida e precisa ser uma origem HTTPS direta do Supabase.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(clientVersion)) {
    throw new Error('A versão do cliente móvel precisa usar o formato numérico x.y.z.');
  }
  if (!['production', 'development'].includes(mode)) {
    throw new Error('PICO_MOBILE_BUILD_MODE aceita somente production ou development.');
  }

  return {
    apiOrigin: parsed.origin,
    storageOrigin: storage.origin,
    clientVersion,
    production: mode === 'production',
  };
}

/** @param {ReturnType<typeof createMobileBuildSettings>} settings */
export function renderMobileRuntimeConfig(settings) {
  const serialized = JSON.stringify({
    apiOrigin: settings.apiOrigin,
    clientVersion: settings.clientVersion,
  })
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');

  return `window.__PICO_MOBILE_CONFIG__ = Object.freeze(${serialized});\n`;
}

/**
 * @param {ReturnType<typeof createMobileBuildSettings>} settings
 * @param {{ hasCss?: boolean }} options
 */
export function renderMobileIndex(settings, { hasCss = true } = {}) {
  const policy = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src 'self' capacitor: ${settings.apiOrigin} ${settings.storageOrigin}`,
  ].join('; ');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#F8F3E7" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#282121" media="(prefers-color-scheme: dark)" />
    <meta http-equiv="Content-Security-Policy" content="${policy}" />
    <link rel="icon" href="pico-club.png" />
    <link rel="preload" href="syne.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="manrope.woff2" as="font" type="font/woff2" crossorigin />
    ${hasCss ? '<link rel="stylesheet" href="app.css" />' : ''}
    <title>Pico Social</title>
  </head>
  <body>
    <div id="root"><noscript>Ative o JavaScript para usar o Pico Social.</noscript></div>
    <script src="mobile-config.js"></script>
    <script type="module" src="app.js"></script>
  </body>
</html>
`;
}

function renderNativeErrorPage() {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="light dark" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; style-src 'self'; font-src 'self'; img-src 'self'" />
    <link rel="stylesheet" href="native-error.css" />
    <title>Pico indisponível</title>
  </head>
  <body>
    <main>
      <img src="pico-club.png" width="96" height="96" alt="" />
      <h1>Não foi possível abrir o Pico.</h1>
      <p>Confira sua conexão e abra o aplicativo novamente. Nenhuma ação foi enviada automaticamente.</p>
    </main>
  </body>
</html>
`;
}

function renderNativeErrorStyles() {
  return `@font-face{font-family:Syne;src:url("syne.woff2") format("woff2");font-display:swap;font-weight:600 800}@font-face{font-family:Manrope;src:url("manrope.woff2") format("woff2");font-display:swap;font-weight:400 700}:root{color-scheme:light dark;font-family:Manrope,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8f3e7;color:#44342f}*{box-sizing:border-box}body{min-height:100dvh;margin:0;display:grid;place-items:center;padding:max(24px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left))}main{width:min(100%,28rem);text-align:center}img{display:block;margin:0 auto 24px;border-radius:22px}h1{margin:0 0 1rem;font-family:Syne,sans-serif;font-size:2rem;line-height:1.1}p{margin:0;font-size:1rem;line-height:1.65}@media(prefers-color-scheme:dark){:root{background:#282121;color:#f8f3e7}}\n`;
}

/**
 * Build the local Capacitor web bundle. This writes only generated files under
 * native-shell and never calls cap sync, xcodebuild, signing or upload tools.
 *
 * @param {{ root?: string, environment?: Record<string, string | undefined> }} options
 */
export async function buildMobile({ root = defaultRoot, environment = process.env } = {}) {
  const settings = createMobileBuildSettings(environment);
  const outputDirectory = resolve(root, 'native-shell');
  const entryPoint = resolve(root, 'apps/mobile/main.tsx');
  const outputScript = resolve(outputDirectory, 'app.js');
  const outputStyles = resolve(outputDirectory, 'app.css');
  const brandDirectory = resolve(root, 'docs/brand-exploration/aura-manteiga');

  try {
    const entry = await stat(entryPoint);
    if (!entry.isFile()) throw new Error();
  } catch {
    throw new Error(`Entrada do cliente móvel ausente: ${entryPoint}`);
  }

  await mkdir(outputDirectory, { recursive: true });
  const result = await build({
    assetNames: '[name]',
    entryPoints: [entryPoint],
    outfile: outputScript,
    bundle: true,
    charset: 'utf8',
    define: {
      'process.env.NODE_ENV': JSON.stringify(settings.production ? 'production' : 'development'),
    },
    format: 'esm',
    jsx: 'automatic',
    legalComments: 'none',
    logLevel: 'info',
    loader: { '.woff2': 'file' },
    metafile: true,
    minify: settings.production,
    platform: 'browser',
    pure: settings.production ? ['console.log', 'console.debug', 'console.trace'] : [],
    drop: settings.production ? ['debugger'] : [],
    sourcemap: false,
    target: ['safari15'],
    treeShaking: true,
    plugins: [{
      name: 'pico-mobile-brand-fonts',
      setup(context) {
        context.onResolve({ filter: /^(?:\.\/fonts\/|\/)(syne|manrope)\.woff2$/ }, (args) => ({
          path: resolve(brandDirectory, 'fonts', args.path.includes('syne.woff2') ? 'syne.woff2' : 'manrope.woff2'),
        }));
      },
    }],
  });

  const hasCss = Object.keys(result.metafile.outputs).some((path) => resolve(root, path) === outputStyles);
  if (!hasCss) await unlink(outputStyles).catch((error) => {
    if (error?.code !== 'ENOENT') throw error;
  });

  await Promise.all([
    copyFile(resolve(brandDirectory, 'fonts/syne.woff2'), resolve(outputDirectory, 'syne.woff2')),
    copyFile(resolve(brandDirectory, 'fonts/manrope.woff2'), resolve(outputDirectory, 'manrope.woff2')),
    copyFile(resolve(brandDirectory, 'pico-club/icon-1024.png'), resolve(outputDirectory, 'pico-club.png')),
    writeFile(resolve(outputDirectory, 'mobile-config.js'), renderMobileRuntimeConfig(settings), 'utf8'),
    writeFile(resolve(outputDirectory, 'index.html'), renderMobileIndex(settings, { hasCss }), 'utf8'),
    writeFile(resolve(outputDirectory, 'native-error.html'), renderNativeErrorPage(), 'utf8'),
    writeFile(resolve(outputDirectory, 'native-error.css'), renderNativeErrorStyles(), 'utf8'),
  ]);

  return {
    ...settings,
    outputDirectory,
    files: [
      'app.js',
      ...(hasCss ? ['app.css'] : []),
      'mobile-config.js',
      'index.html',
      'native-error.html',
      'native-error.css',
      'pico-club.png',
      'syne.woff2',
      'manrope.woff2',
    ],
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = await buildMobile();
    process.stdout.write(`Cliente iOS local gerado em ${result.outputDirectory} (${result.clientVersion}, API ${result.apiOrigin}).\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

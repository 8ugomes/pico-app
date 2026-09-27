import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

import sharp from 'sharp';

const paths = [
  'android/app/src/main/assets/capacitor.config.json',
  'ios/App/App/capacitor.config.json',
];

for (const path of paths) {
  if (!existsSync(path)) throw new Error(`Projeto nativo não sincronizado: ${path}`);
  const config = JSON.parse(readFileSync(path, 'utf8'));
  if (config.server?.url) throw new Error(`Configuração remota encontrada em ${path}. Rode npm run native:sync antes de preparar um pacote local.`);
  if (config.appId !== 'com.picosocial.preview') throw new Error(`Identificador inesperado em ${path}.`);
  if (config.appName !== 'Pico Social Preview') throw new Error(`Nome do Pico Social ausente em ${path}.`);
  if (config.webDir !== 'native-shell') throw new Error(`Diretório web inesperado em ${path}.`);
  if (config.plugins?.StatusBar?.style !== 'LIGHT') throw new Error(`Estilo da barra de status inesperado em ${path}.`);
  if (config.loggingBehavior !== 'none') throw new Error(`Logs de preview encontrados no pacote local: ${path}`);
}

const brandedCopies = [
  'native-shell/pico-club.png',
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
];
const source = readFileSync('docs/brand-exploration/aura-manteiga/pico-club/icon-1024.png');
const sourceHash = createHash('sha256').update(source).digest('hex');
for (const path of brandedCopies) {
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (hash !== sourceHash) throw new Error(`Cópia do ícone não corresponde ao mestre: ${path}`);
}

const dimensions = {
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': [192, 192],
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png': [432, 432],
  'android/app/src/main/res/drawable-port-xxxhdpi/splash.png': [1280, 1920],
  'android/app/src/main/res/drawable-land-xxxhdpi/splash.png': [1920, 1280],
  'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png': [2732, 2732],
};
for (const [path, [width, height]] of Object.entries(dimensions)) {
  const metadata = await sharp(path).metadata();
  if (metadata.width !== width || metadata.height !== height) {
    throw new Error(`Dimensão inesperada em ${path}: ${metadata.width}x${metadata.height}`);
  }
}

const adaptiveForeground = await sharp('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png')
  .trim()
  .toBuffer({ resolveWithObject: true });
if (adaptiveForeground.info.width > 264 || adaptiveForeground.info.height > 264) {
  throw new Error(`Foreground adaptativo ultrapassa a área segura: ${adaptiveForeground.info.width}x${adaptiveForeground.info.height}`);
}

process.stdout.write('Configurações e ativos nativos conferidos, sem server.url remoto.\n');

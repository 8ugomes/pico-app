import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const root = process.cwd();
const brandRoot = path.join(root, 'docs/brand-exploration/aura-manteiga/pico-club');
const iconSource = path.join(brandRoot, 'icon-1024.png');
const backgroundSource = path.join(brandRoot, 'background.png');
const maskableSource = path.join(brandRoot, 'maskable.svg');

const androidIconSizes = {
  mdpi: { icon: 48, foreground: 108 },
  hdpi: { icon: 72, foreground: 162 },
  xhdpi: { icon: 96, foreground: 216 },
  xxhdpi: { icon: 144, foreground: 324 },
  xxxhdpi: { icon: 192, foreground: 432 },
};

const androidSplashSizes = {
  'drawable/splash.png': [480, 320],
  'drawable-land-mdpi/splash.png': [480, 320],
  'drawable-land-hdpi/splash.png': [800, 480],
  'drawable-land-xhdpi/splash.png': [1280, 720],
  'drawable-land-xxhdpi/splash.png': [1600, 960],
  'drawable-land-xxxhdpi/splash.png': [1920, 1280],
  'drawable-port-mdpi/splash.png': [320, 480],
  'drawable-port-hdpi/splash.png': [480, 800],
  'drawable-port-xhdpi/splash.png': [720, 1280],
  'drawable-port-xxhdpi/splash.png': [960, 1600],
  'drawable-port-xxxhdpi/splash.png': [1280, 1920],
};

async function writePng(pipeline, target, options = { compressionLevel: 9 }) {
  await mkdir(path.dirname(target), { recursive: true });
  await pipeline.png(options).toFile(target);
}

async function transparentLogo() {
  const svg = await readFile(maskableSource, 'utf8');
  const withoutBackground = svg.replace(/<image\b[^>]*\/>/, '');
  if (withoutBackground === svg) throw new Error('Não foi possível separar o logo do fundo maskable.');
  return Buffer.from(withoutBackground);
}

async function centeredLogo(size, scale, logo) {
  const innerSize = Math.round(size * scale);
  const inset = Math.floor((size - innerSize) / 2);
  const remainder = size - innerSize - inset;
  return sharp(logo)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .extend({
      top: inset,
      bottom: remainder,
      left: inset,
      right: remainder,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function splash(width, height, logo) {
  const logoSize = Math.round(Math.min(width, height) * 0.85);
  const overlay = await centeredLogo(logoSize, 1, logo);
  return sharp(backgroundSource)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: overlay, gravity: 'centre' }]);
}

async function generate() {
  const logo = await transparentLogo();

  await copyFile(iconSource, path.join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'));

  for (const name of [
    'splash-2732x2732.png',
    'splash-2732x2732-1.png',
    'splash-2732x2732-2.png',
  ]) {
    await writePng(
      await splash(2732, 2732, logo),
      path.join(root, 'ios/App/App/Assets.xcassets/Splash.imageset', name),
      { compressionLevel: 9, palette: true, quality: 88, colors: 256, effort: 10 },
    );
  }

  const backgroundTarget = path.join(root, 'android/app/src/main/res/drawable-nodpi/pico_launcher_background.png');
  await writePng(sharp(backgroundSource).resize(1024, 1024), backgroundTarget);

  for (const [density, sizes] of Object.entries(androidIconSizes)) {
    const targetDirectory = path.join(root, `android/app/src/main/res/mipmap-${density}`);
    await writePng(sharp(iconSource).resize(sizes.icon, sizes.icon), path.join(targetDirectory, 'ic_launcher.png'));
    await writePng(sharp(iconSource).resize(sizes.icon, sizes.icon), path.join(targetDirectory, 'ic_launcher_round.png'));
    const foreground = await centeredLogo(sizes.foreground, 0.75, logo);
    await writePng(sharp(foreground), path.join(targetDirectory, 'ic_launcher_foreground.png'));
  }

  for (const [relativeTarget, [width, height]] of Object.entries(androidSplashSizes)) {
    await writePng(
      await splash(width, height, logo),
      path.join(root, 'android/app/src/main/res', relativeTarget),
      { compressionLevel: 9, palette: true, quality: 88, colors: 256, effort: 10 },
    );
  }

  await copyFile(iconSource, path.join(root, 'native-shell/pico-club.png'));
  await copyFile(path.join(root, 'src/app/fonts/syne.woff2'), path.join(root, 'native-shell/syne.woff2'));
  await copyFile(path.join(root, 'src/app/fonts/manrope.woff2'), path.join(root, 'native-shell/manrope.woff2'));
  process.stdout.write('Ativos nativos gerados a partir dos mestres Pico Club.\n');
}

await generate();

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  NATIVE_PREVIEW_APP_ID,
  NATIVE_PREVIEW_APP_NAME,
  createNativeConfig,
} from '../scripts/native-config.mjs';
import { isPicoNativePackage } from '../src/lib/native-runtime.ts';

test('native package defaults to the local preview shell', () => {
  const config = createNativeConfig({});

  assert.equal(config.appId, NATIVE_PREVIEW_APP_ID);
  assert.equal(config.appName, NATIVE_PREVIEW_APP_NAME);
  assert.equal(NATIVE_PREVIEW_APP_NAME, 'Pico Social Preview');
  assert.equal(config.webDir, 'native-shell');
  assert.equal(config.server, undefined);
  assert.equal(config.plugins.StatusBar.style, 'LIGHT');
  assert.equal(config.loggingBehavior, 'none');
});

test('hosted preview requires an explicit flag and a secure URL', () => {
  assert.throws(
    () => createNativeConfig({ PICO_NATIVE_PREVIEW_URL: 'https://preview.example.com' }),
    /PICO_NATIVE_PREVIEW=1/,
  );
  assert.throws(
    () => createNativeConfig({ PICO_NATIVE_PREVIEW: '1', PICO_NATIVE_PREVIEW_URL: 'http://preview.example.com' }),
    /HTTPS/,
  );
});

test('hosted preview keeps one exact secure URL and starts in the feed', () => {
  const config = createNativeConfig({
    PICO_NATIVE_PREVIEW: '1',
    PICO_NATIVE_PREVIEW_URL: 'https://preview.example.com/feed',
  });

  assert.deepEqual(config.server, {
    url: 'https://preview.example.com/feed',
    cleartext: false,
    errorPath: 'native-error.html',
  });
  assert.equal(config.loggingBehavior, 'debug');
});

test('hosted preview rejects credentials, query strings and fragments', () => {
  for (const url of [
    'https://user:secret@preview.example.com/feed',
    'https://preview.example.com/feed?token=secret',
    'https://preview.example.com/feed#token',
  ]) {
    assert.throws(
      () => createNativeConfig({ PICO_NATIVE_PREVIEW: '1', PICO_NATIVE_PREVIEW_URL: url }),
      /URL de preview/,
    );
  }
});

test('native platform projects and branded source assets are versioned', () => {
  for (const path of [
    'ios/App/App.xcodeproj/project.pbxproj',
    'android/app/build.gradle',
    'native-shell/index.html',
    'native-shell/native-error.html',
    'native-shell/pico-club.png',
    'native-shell/syne.woff2',
    'native-shell/manrope.woff2',
    'docs/brand-exploration/aura-manteiga/pico-club/icon-1024.png',
  ]) {
    assert.equal(existsSync(path), true, `Arquivo nativo ausente: ${path}`);
  }
});

test('local client uses the product name while native identifiers stay explicitly provisional', () => {
  const shell = readFileSync('native-shell/index.html', 'utf8');
  assert.match(shell, /<title>Pico Social<\/title>/);
  assert.doesNotMatch(shell, /Pico Club Preview/);

  for (const path of [
    'ios/App/App/Info.plist',
    'android/app/src/main/res/values/strings.xml',
  ]) {
    const contents = readFileSync(path, 'utf8');
    assert.match(contents, /Pico Social Preview/, `Identificador provisório ausente em ${path}`);
    assert.doesNotMatch(contents, /Pico Club Preview/, `Nome antigo ainda presente em ${path}`);
  }
});

test('the hosted app recognizes only the explicit native package marker', () => {
  assert.equal(isPicoNativePackage('Mozilla/5.0 PicoNativeApp/1'), true);
  assert.equal(isPicoNativePackage('Mozilla/5.0 PicoNativePreview/1'), false);
  assert.equal(isPicoNativePackage('Mozilla/5.0 Safari/605.1.15'), false);
  assert.equal(isPicoNativePackage(undefined), false);
});

test('native doctor reports every required mobile toolchain layer', () => {
  const result = spawnSync(process.execPath, ['scripts/native-doctor.mjs', '--json'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const checks = JSON.parse(result.stdout);
  for (const key of [
    'xcode',
    'iosSimulatorRuntime',
    'androidStudio',
    'java',
    'androidSdk',
    'androidSdkManager',
    'androidPlatform36',
    'androidBuildTools36',
    'androidPlatformTools',
    'androidEmulator',
    'androidArm64SystemImage',
  ]) {
    assert.equal(typeof checks[key]?.available, 'boolean', `Camada ausente no diagnóstico: ${key}`);
  }
});

test('native package exposes a locked iOS Simulator build without Apple provisioning', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const script = packageJson.scripts?.['native:build:ios'];
  const resolvedPackages = JSON.parse(
    readFileSync('ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved', 'utf8'),
  );
  const capacitorPackage = resolvedPackages.pins?.find((pin) => pin.identity === 'capacitor-swift-pm');

  assert.equal(typeof script, 'string');
  assert.match(script, /xcodebuild/);
  assert.match(script, /generic\/platform=iOS Simulator/);
  assert.match(script, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(script, /build\/native-ios/);
  assert.match(script, /onlyUsePackageVersionsFromResolvedFile/);
  assert.equal(capacitorPackage?.state?.version, packageJson.dependencies['@capacitor/ios']);
  assert.match(capacitorPackage?.state?.revision || '', /^[0-9a-f]{40}$/);
});

test('iOS launch screen preserves the complete Pico Club artwork on tall displays', () => {
  const launchScreen = readFileSync('ios/App/App/Base.lproj/LaunchScreen.storyboard', 'utf8');

  assert.match(launchScreen, /contentMode="scaleAspectFit"/);
  assert.doesNotMatch(launchScreen, /contentMode="scaleAspectFill"/);
});

test('the first iOS release targets iPhone until the iPad experience is validated', () => {
  const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
  assert.doesNotMatch(project, /TARGETED_DEVICE_FAMILY = "1,2";/);
  assert.equal((project.match(/TARGETED_DEVICE_FAMILY = 1;/g) ?? []).length, 2);
});

test('iOS export compliance records standard exempt transport only', () => {
  const info = readFileSync('ios/App/App/Info.plist', 'utf8');
  assert.match(info, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.match(info, /<key>CFBundleDevelopmentRegion<\/key>\s*<string>pt_BR<\/string>/);
  const orientations = info.match(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? '';
  assert.match(orientations, /UIInterfaceOrientationPortrait/);
  assert.doesNotMatch(orientations, /Landscape/);
});

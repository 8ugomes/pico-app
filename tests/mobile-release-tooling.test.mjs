import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  DEFAULT_MOBILE_API_ORIGIN,
  DEFAULT_MOBILE_STORAGE_ORIGIN,
  createMobileBuildSettings,
  renderMobileIndex,
  renderMobileRuntimeConfig,
} from '../scripts/build-mobile.mjs';
import { inspectIosRelease } from '../scripts/ios-release-preflight.mjs';

const aggregatedPrivacyManifest = `
  <key>NSPrivacyTracking</key><false/>
  <string>NSPrivacyAccessedAPICategoryUserDefaults</string><string>CA92.1</string>
  <string>NSPrivacyAccessedAPICategoryFileTimestamp</string><string>C617.1</string><string>3B52.1</string>
`;

test('mobile build accepts only an HTTPS origin and a semantic client version', () => {
  assert.deepEqual(createMobileBuildSettings({}), {
    apiOrigin: DEFAULT_MOBILE_API_ORIGIN,
    storageOrigin: DEFAULT_MOBILE_STORAGE_ORIGIN,
    clientVersion: '1.0.0',
    production: true,
  });

  assert.equal(
    createMobileBuildSettings({
      PICO_MOBILE_API_ORIGIN: 'https://social.example.com/',
      PICO_MOBILE_CLIENT_VERSION: '2.4.1',
      PICO_MOBILE_BUILD_MODE: 'development',
    }).apiOrigin,
    'https://social.example.com',
  );

  for (const value of [
    'http://social.example.com',
    'https://user:secret@social.example.com',
    'https://social.example.com/api',
    'https://social.example.com?token=secret',
  ]) {
    assert.throws(
      () => createMobileBuildSettings({ PICO_MOBILE_API_ORIGIN: value }),
      /origem.*HTTPS|origem.*credenciais|origem.*caminho/i,
    );
  }
  assert.throws(
    () => createMobileBuildSettings({ PICO_MOBILE_CLIENT_VERSION: 'latest' }),
    /versão/i,
  );
  for (const value of [
    'http://project.storage.supabase.co',
    'https://project.supabase.co',
    'https://project.storage.supabase.co/upload',
    'https://storage.example.com',
  ]) {
    assert.throws(
      () => createMobileBuildSettings({ PICO_MOBILE_STORAGE_ORIGIN: value }),
      /Storage móvel/i,
    );
  }
});

test('mobile shell keeps configuration external and locks network access to the API origin', () => {
  const settings = createMobileBuildSettings({
    PICO_MOBILE_API_ORIGIN: 'https://social.example.com',
    PICO_MOBILE_CLIENT_VERSION: '2.4.1',
  });
  const html = renderMobileIndex(settings, { hasCss: true });
  const runtime = renderMobileRuntimeConfig(settings);

  assert.match(html, /connect-src 'self' capacitor: https:\/\/social\.example\.com/);
  assert.match(html, new RegExp(`connect-src[^;]+${DEFAULT_MOBILE_STORAGE_ORIGIN.replaceAll('.', '\\.')}`));
  assert.doesNotMatch(html, /\*\.storage\.supabase\.co/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /style-src 'self'/);
  assert.match(html, /<script src="mobile-config\.js"><\/script>/);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
  assert.match(html, /<link rel="stylesheet" href="app\.css"/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
  assert.doesNotMatch(html, /<style>/);

  assert.match(runtime, /window\.__PICO_MOBILE_CONFIG__/);
  assert.match(runtime, /"apiOrigin":"https:\/\/social\.example\.com"/);
  assert.match(runtime, /"clientVersion":"2\.4\.1"/);
  assert.doesNotMatch(runtime, /token|secret|password/i);
});

test('release preflight reports human gates and package findings without mutating the tree', () => {
  const root = mkdtempSync(join(tmpdir(), 'pico-ios-preflight-'));
  try {
    const files = {
      'ios/App/App/Info.plist': '<key>CFBundleDisplayName</key><string>Pico Social Preview</string>',
      'ios/App/App.xcodeproj/project.pbxproj': `
        PRODUCT_BUNDLE_IDENTIFIER = com.picosocial.preview;
        DEVELOPMENT_TEAM = "";
        loggingBehavior = none;
        PrivacyInfo.xcprivacy in Resources;
      `,
      'ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme': '<ArchiveAction buildConfiguration = "Release" />',
      'ios/App/App/PrivacyInfo.xcprivacy': aggregatedPrivacyManifest,
      'ios/App/App/capacitor.config.json': JSON.stringify({
        appId: 'com.picosocial.preview',
        appName: 'Pico Social Preview',
        webDir: 'native-shell',
        loggingBehavior: 'none',
        appendUserAgent: ' PicoNativeApp/1',
      }),
      'ios/App/App/public/index.html': '<script type="module" src="app.js"></script>',
      'ios/App/App/public/app.js': 'document.body.textContent = "Pico";',
    };
    for (const [relativePath, contents] of Object.entries(files)) {
      const absolutePath = join(root, relativePath);
      mkdirSync(join(absolutePath, '..'), { recursive: true });
      writeFileSync(absolutePath, contents);
    }

    const before = readFileSync(join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
    const report = inspectIosRelease({ root, env: {}, signingIdentities: [] });
    const after = readFileSync(join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');

    assert.equal(report.ready, false);
    assert.equal(after, before);
    assert.equal(report.checks.find((check) => check.id === 'remote-server-url')?.ok, true);
    assert.equal(report.checks.find((check) => check.id === 'debug-logging')?.ok, true);
    assert.equal(report.checks.find((check) => check.id === 'privacy-manifest')?.ok, true);
    for (const id of [
      'final-app-name',
      'final-bundle-id',
      'apple-team',
      'public-domain',
      'support-contact',
      'privacy-contact',
      'legal-controller',
      'signing-identity',
      'auth-abuse-control',
    ]) {
      assert.equal(report.checks.find((check) => check.id === id)?.ok, false, `Gate deveria estar pendente: ${id}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('release preflight rejects packaged secrets and debug calls', () => {
  const root = mkdtempSync(join(tmpdir(), 'pico-ios-preflight-secret-'));
  try {
    const files = {
      'ios/App/App/Info.plist': '<key>CFBundleDisplayName</key><string>Pico</string>',
      'ios/App/App.xcodeproj/project.pbxproj': `
        PRODUCT_BUNDLE_IDENTIFIER = social.pico.app;
        DEVELOPMENT_TEAM = ABCDE12345;
        PrivacyInfo.xcprivacy in Resources;
      `,
      'ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme': '<ArchiveAction buildConfiguration = "Release" />',
      'ios/App/App/PrivacyInfo.xcprivacy': aggregatedPrivacyManifest,
      'ios/App/App/capacitor.config.json': JSON.stringify({
        appId: 'social.pico.app',
        appName: 'Pico',
        webDir: 'native-shell',
        loggingBehavior: 'none',
        appendUserAgent: ' PicoNativeApp/1',
      }),
      'ios/App/App/public/index.html': '<script type="module" src="app.js"></script>',
      'ios/App/App/public/app.js': 'console.debug("token"); const SUPABASE_SERVICE_ROLE_KEY = "leak";',
      'ios/App/App/public/app.css': ':root { color: #44342f; }',
    };
    for (const [relativePath, contents] of Object.entries(files)) {
      const absolutePath = join(root, relativePath);
      mkdirSync(join(absolutePath, '..'), { recursive: true });
      writeFileSync(absolutePath, contents);
    }

    const environment = {
      PICO_IOS_APP_NAME: 'Pico',
      PICO_IOS_BUNDLE_ID: 'social.pico.app',
      PICO_IOS_TEAM_ID: 'ABCDE12345',
      PICO_PUBLIC_ORIGIN: 'https://pico.social',
      PICO_PUBLIC_SUPPORT_EMAIL: 'suporte@pico.social',
      PICO_PUBLIC_PRIVACY_EMAIL: 'privacidade@pico.social',
      PICO_LEGAL_CONTROLLER: 'Pico Tecnologia Ltda.',
      PICO_IOS_SIGNING_IDENTITY: 'Apple Distribution: Pico Tecnologia Ltda. (ABCDE12345)',
      PICO_AUTH_ABUSE_CONTROL: 'turnstile',
    };
    const signingIdentities = ['Apple Distribution: Pico Tecnologia Ltda. (ABCDE12345)'];
    const report = inspectIosRelease({
      root,
      env: environment,
      signingIdentities,
    });

    assert.equal(report.checks.find((check) => check.id === 'packaged-secrets')?.ok, false);
    assert.equal(report.checks.find((check) => check.id === 'debug-logging')?.ok, false);
    assert.equal(report.ready, false);

    writeFileSync(join(root, 'ios/App/App/public/app.js'), 'document.body.textContent = "Pico";');
    const cleanReport = inspectIosRelease({ root, env: environment, signingIdentities });
    assert.equal(cleanReport.ready, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

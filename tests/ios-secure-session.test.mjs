import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const pluginPath = 'ios/App/App/PicoSecureSessionPlugin.swift';
const bridgePath = 'ios/App/App/PicoBridgeViewController.swift';
const privacyPath = 'ios/App/App/PrivacyInfo.xcprivacy';
const videoPluginPath = 'ios/App/App/PicoVideoPlayerPlugin.swift';
const schemePath = 'ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme';

test('iOS keeps only the refresh token in the device-only Keychain', () => {
  assert.equal(existsSync(pluginPath), true, `Ponte Keychain ausente: ${pluginPath}`);

  const plugin = readFileSync(pluginPath, 'utf8');
  const methods = [...plugin.matchAll(/CAPPluginMethod\(name: "([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(methods, [
    'saveRefreshToken',
    'readRefreshToken',
    'clearRefreshToken',
    'releasePrivacyCover',
  ]);
  assert.match(plugin, /kSecClassGenericPassword/);
  assert.match(plugin, /kSecAttrAccessibleWhenUnlockedThisDeviceOnly/);
  assert.match(plugin, /kSecAttrSynchronizable[\s\S]*kCFBooleanFalse/);
  assert.match(plugin, /InstallationMarker/);
  assert.match(plugin, /keychainQueue = DispatchQueue/);
  assert.match(plugin, /private func ensureInstallationReady\(\) -> Bool/);
  assert.match(plugin, /let status = SecItemDelete\(itemQuery as CFDictionary\)[\s\S]*guard status == errSecSuccess \|\| status == errSecItemNotFound else \{ return false \}[\s\S]*defaults\.set\(true/);
  assert.equal((plugin.match(/guard self\.ensureInstallationReady\(\) else/g) ?? []).length, 3);
  assert.match(plugin, /saveRefreshToken[\s\S]*guard self\.ensureInstallationReady\(\) else[\s\S]*SecItemUpdate/);
  assert.match(plugin, /readRefreshToken[\s\S]*guard self\.ensureInstallationReady\(\) else[\s\S]*SecItemCopyMatching/);
  assert.doesNotMatch(plugin, /defaults\.set\([^\n]*(?:refresh|token)/i);
  assert.doesNotMatch(plugin, /accessToken/i);
});

test('Capacitor registers the secure-session plugin in the app bridge', () => {
  assert.equal(existsSync(bridgePath), true, `Bridge nativa ausente: ${bridgePath}`);

  const bridge = readFileSync(bridgePath, 'utf8');
  const sceneDelegate = readFileSync('ios/App/App/SceneDelegate.swift', 'utf8');
  const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');

  assert.match(bridge, /class PicoBridgeViewController: CAPBridgeViewController/);
  assert.match(bridge, /var usesLocalContent: Bool/);
  assert.match(bridge, /bridge\.config\.serverURL == bridge\.config\.localURL/);
  assert.match(bridge, /registerPluginInstance\(PicoSecureSessionPlugin\(\)\)/);
  assert.match(sceneDelegate, /rootViewController = PicoBridgeViewController\(\)/);
  assert.match(project, /PicoSecureSessionPlugin\.swift in Sources/);
  assert.match(project, /PicoBridgeViewController\.swift in Sources/);
});

test('iOS hides private content in app-switcher snapshots', () => {
  const sceneDelegate = readFileSync('ios/App/App/SceneDelegate.swift', 'utf8');
  assert.match(sceneDelegate, /func sceneWillResignActive/);
  assert.match(sceneDelegate, /window\.addSubview\(cover\)/);
  assert.match(sceneDelegate, /func sceneDidBecomeActive/);
  assert.match(sceneDelegate, /!bridge\.usesLocalContent/);
  assert.match(sceneDelegate, /picoForegroundReady/);
  assert.match(sceneDelegate, /private func releasePrivacyCover/);
  assert.match(sceneDelegate, /privacyCover\?\.removeFromSuperview\(\)/);
});

test('private videos stream through the authenticated native range player', () => {
  assert.equal(existsSync(videoPluginPath), true, `Player nativo ausente: ${videoPluginPath}`);
  const player = readFileSync(videoPluginPath, 'utf8');
  const bridge = readFileSync(bridgePath, 'utf8');
  const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
  assert.match(player, /AVAssetResourceLoaderDelegate/);
  assert.match(player, /URLSessionDataDelegate/);
  assert.match(player, /Authorization/);
  assert.match(player, /X-Pico-Client-Version/);
  assert.match(player, /Range/);
  assert.match(player, /min\(requestedLength, 1024 \* 1024\)/);
  assert.match(player, /URLSessionConfiguration\.ephemeral/);
  assert.match(player, /configuration\.httpCookieStorage = nil/);
  assert.match(player, /configuration\.httpShouldSetCookies = false/);
  assert.match(player, /configuration\.urlCache = nil/);
  assert.match(player, /startNextChunk\(for:/);
  assert.match(player, /dataRequest\.currentOffset < targetOffset/);
  assert.match(player, /willPerformHTTPRedirection[\s\S]*completionHandler\(nil\)/);
  assert.match(player, /Bundle\.main\.object\(forInfoDictionaryKey: "PicoMobileAPIOrigin"\)/);
  assert.match(player, /originValue == allowedOrigin\.absoluteString/);
  assert.match(player, /origin == allowedOrigin/);
  assert.doesNotMatch(player, /URLQueryItem\(name: "(?:accessToken|token)"/);
  assert.doesNotMatch(player, /UserDefaults|write\(to:|downloadTask/);
  const info = readFileSync('ios/App/App/Info.plist', 'utf8');
  assert.match(info, /<key>PicoMobileAPIOrigin<\/key>\s*<string>https:\/\/pico-app-sepia\.vercel\.app<\/string>/);
  assert.match(bridge, /registerPluginInstance\(PicoVideoPlayerPlugin\(\)\)/);
  assert.match(project, /PicoVideoPlayerPlugin\.swift in Sources/);
});

test('the app privacy manifest aggregates app and camera SDK declarations', () => {
  assert.equal(existsSync(privacyPath), true, `Manifesto de privacidade ausente: ${privacyPath}`);

  const manifest = readFileSync(privacyPath, 'utf8');
  const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');

  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(manifest, /<key>NSPrivacyTrackingDomains<\/key>\s*<array\/>/);
  assert.match(manifest, /NSPrivacyAccessedAPICategoryUserDefaults/);
  assert.match(manifest, /<string>CA92\.1<\/string>/);
  assert.match(manifest, /NSPrivacyAccessedAPICategoryFileTimestamp/);
  assert.match(manifest, /<string>C617\.1<\/string>/);
  assert.match(manifest, /<string>3B52\.1<\/string>/);

  for (const dataType of [
    'NSPrivacyCollectedDataTypeName',
    'NSPrivacyCollectedDataTypeEmailAddress',
    'NSPrivacyCollectedDataTypeUserID',
    'NSPrivacyCollectedDataTypeContacts',
    'NSPrivacyCollectedDataTypeFitness',
    'NSPrivacyCollectedDataTypeCoarseLocation',
    'NSPrivacyCollectedDataTypePhotosorVideos',
    'NSPrivacyCollectedDataTypeOtherUserContent',
    'NSPrivacyCollectedDataTypeProductInteraction',
    'NSPrivacyCollectedDataTypeOtherDiagnosticData',
  ]) {
    assert.match(manifest, new RegExp(`<string>${dataType}<\\/string>`));
  }

  assert.doesNotMatch(manifest, /NSPrivacyCollectedDataTypePurposeAnalytics/);
  assert.doesNotMatch(manifest, /NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising/);
  assert.match(manifest, /NSPrivacyCollectedDataTypePurposeProductPersonalization/);
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
});

test('the versioned App scheme can produce a Release archive', () => {
  assert.equal(existsSync(schemePath), true, `Scheme compartilhado ausente: ${schemePath}`);

  const scheme = readFileSync(schemePath, 'utf8');

  assert.match(scheme, /BlueprintIdentifier = "504EC3031FED79650016851F"/);
  assert.match(scheme, /buildForArchiving = "YES"/);
  assert.match(scheme, /<ArchiveAction[\s\S]*buildConfiguration = "Release"/);
});

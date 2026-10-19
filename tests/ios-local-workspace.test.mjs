import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { createWebLocalWorkspaceStorage } from '../apps/mobile/local-workspace-storage.ts';

const pluginPath = 'ios/App/App/PicoLocalWorkspacePlugin.swift';
const bridgePath = 'ios/App/App/PicoBridgeViewController.swift';
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';

test('iOS stores the private local workspace in a protected Application Support file', () => {
  assert.equal(existsSync(pluginPath), true, `Plugin de workspace ausente: ${pluginPath}`);

  const plugin = readFileSync(pluginPath, 'utf8');
  const methods = [...plugin.matchAll(/CAPPluginMethod\(name: "([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(methods, ['read', 'write', 'clear']);
  assert.match(plugin, /\.applicationSupportDirectory/);
  assert.match(plugin, /workspace-v1\.json/);
  assert.match(plugin, /completeFileProtection/);
  assert.match(plugin, /FileProtectionType\.complete/);
  assert.match(plugin, /replaceItemAt/);
  assert.match(plugin, /\.completeFileProtection/);
  assert.match(plugin, /isExcludedFromBackup = true/);
  assert.match(plugin, /maximumWorkspaceCharacters = 1_000_000/);
  assert.match(plugin, /UserDefaults\.standard\.removeObject/);
  assert.match(plugin, /UserDefaults\.standard\.synchronize/);
  assert.doesNotMatch(plugin, /UserDefaults\.standard\.set/);
  assert.match(plugin, /LOCAL_WORKSPACE_CORRUPT/);
  assert.match(plugin, /clearTemporaryWorkspaceFiles/);
  assert.match(plugin, /name\.hasPrefix\("\.workspace-"\), name\.hasSuffix\("\.tmp"\)/);
  const readMethod = plugin.slice(plugin.indexOf('@objc func read'), plugin.indexOf('@objc func write'));
  const writeMethod = plugin.slice(plugin.indexOf('@objc func write'), plugin.indexOf('@objc func clear'));
  const clearMethod = plugin.slice(plugin.indexOf('@objc func clear'));
  assert.doesNotMatch(readMethod, /clearLegacyWorkspacePreferences/);
  assert.match(readMethod, /clearTemporaryWorkspaceFiles/);
  assert.match(writeMethod, /clearLegacyWorkspacePreferences/);
  assert.match(writeMethod, /clearTemporaryWorkspaceFiles/);
  assert.match(clearMethod, /clearTemporaryWorkspaceFiles/);
});

test('Capacitor registers the local-workspace plugin in the local app bridge', () => {
  const bridge = readFileSync(bridgePath, 'utf8');
  const project = readFileSync(projectPath, 'utf8');

  assert.match(bridge, /registerPluginInstance\(PicoLocalWorkspacePlugin\(\)\)/);
  assert.match(project, /PicoLocalWorkspacePlugin\.swift in Sources/);
});

test('workspace persistence has a browser localStorage implementation without writing JSON to Preferences', () => {
  const repository = readFileSync('apps/mobile/local-store.ts', 'utf8');
  const storage = readFileSync('apps/mobile/local-workspace-storage.ts', 'utf8');

  assert.match(storage, /registerPlugin<LocalWorkspaceStorage>\('PicoLocalWorkspace'/);
  assert.match(storage, /globalThis\.localStorage/);
  assert.match(storage, /pico\.mobile\.local\.v1\.workspace/);
  assert.match(repository, /LOCAL_MODE_KEY/);
  assert.match(repository, /workspaceStorage\.write/);
  assert.doesNotMatch(repository, /modeStorage\.set\(\{ key: LEGACY_LOCAL_WORKSPACE_KEY/);
});

test('browser fallback reads, writes and clears only its workspace key', async () => {
  const values = new Map();
  const browserStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
  const storage = createWebLocalWorkspaceStorage(browserStorage);

  assert.deepEqual(await storage.read(), { value: null });
  await storage.write({ value: '{"version":1}' });
  assert.deepEqual(await storage.read(), { value: '{"version":1}' });
  assert.deepEqual([...values.keys()], ['pico.mobile.local.v1.workspace']);
  await storage.clear();
  assert.deepEqual(await storage.read(), { value: null });
});

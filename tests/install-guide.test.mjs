import test from 'node:test';
import assert from 'node:assert/strict';
import { installDevice, installationScenes, installationJourneyReady, installInvitationKey } from '../src/lib/install-guide.ts';

test('install guide recognizes phones, iPad desktop mode and embedded browsers', () => {
  assert.deepEqual(installDevice('Mozilla iPhone Version/26 Mobile Safari/605'), { platform: 'ios', needsBrowser: false });
  assert.equal(installDevice('Mozilla Macintosh Version/26 Safari/605', 5).platform, 'ios');
  assert.equal(installDevice('Mozilla Macintosh Version/26 Safari/605', 0).platform, 'desktop');
  assert.deepEqual(installDevice('Mozilla Android 16 Chrome/144 Mobile Safari'), { platform: 'android', needsBrowser: false });
  for (const ua of ['iPhone CriOS/144', 'iPhone Instagram', 'Android Chrome/144; wv)', 'Android SamsungBrowser Chrome/144', 'Android Firefox/144']) assert.equal(installDevice(ua).needsBrowser, true, ua);
});

test('installation waits for every earlier step, including closing the completion screen', () => {
  const ready = { profileReady: true, welcomeSettled: true, tourStatus: 'complete', finishing: false, editing: false };
  assert.equal(installationJourneyReady(ready), true);
  assert.equal(installationJourneyReady({ ...ready, tourStatus: 'dismissed' }), true);
  for (const tourStatus of [undefined, 'active', 'paused', 'unknown']) assert.equal(installationJourneyReady({ ...ready, tourStatus }), false);
  for (const key of ['profileReady', 'welcomeSettled', 'finishing', 'editing']) assert.equal(installationJourneyReady({ ...ready, [key]: !ready[key] }), false, key);
});

test('Safari layout determines the initial control, and Android has its own install path', () => {
  assert.deepEqual(installationScenes('ios', 'compact'), ['menu', 'share', 'home-option', 'web-app', 'confirm', 'home']);
  assert.deepEqual(installationScenes('ios', 'classic'), ['share', 'home-option', 'web-app', 'confirm', 'home']);
  assert.deepEqual(installationScenes('android', 'compact'), ['menu', 'home-option', 'web-app', 'confirm', 'home']);
  assert.notEqual(installInvitationKey('account:a'), installInvitationKey('account:b'));
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDeepLink } from '../apps/mobile/deep-links.ts';

const origin = 'https://pico-app-sepia.vercel.app';

test('deep links resolve canonical public resources without dropping their identity', () => {
  assert.deepEqual(parseDeepLink(`${origin}/publicacoes/018f1f47-9264-7c39-9ee4-3adf71f1a050`, origin), {
    tab: 'home', kind: 'post', id: '018f1f47-9264-7c39-9ee4-3adf71f1a050',
  });
  assert.deepEqual(parseDeepLink(`${origin}/perfil/maria_areia`, origin), {
    tab: 'people', kind: 'player', username: 'maria_areia',
  });
  assert.deepEqual(parseDeepLink(`${origin}/comunidades/volei-da-praia`, origin), {
    tab: 'communities', kind: 'community', slug: 'volei-da-praia',
  });
  assert.deepEqual(parseDeepLink(`${origin}/arenas/praia-central`, origin), {
    tab: 'arenas', kind: 'arena', slug: 'praia-central',
  });
});

test('deep links reject foreign hosts, lookalikes and malformed identifiers', () => {
  assert.equal(parseDeepLink('https://example.com/publicacoes/018f1f47-9264-7c39-9ee4-3adf71f1a050', origin), null);
  assert.equal(parseDeepLink('https://pico-app-sepia.vercel.app.evil/perfil/maria_areia', origin), null);
  assert.equal(parseDeepLink('http://pico-app-sepia.vercel.app/perfil/maria_areia', origin), null);
  assert.equal(parseDeepLink(`${origin}/publicacoes/not-a-uuid`, origin), null);
  assert.equal(parseDeepLink(`${origin}/arenas/../conta`, origin), null);
});

test('deep links preserve canonical tab destinations', () => {
  assert.deepEqual(parseDeepLink(`${origin}/feed`, origin), { tab: 'home', kind: 'tab' });
  assert.deepEqual(parseDeepLink(`${origin}/descobrir`, origin), { tab: 'people', kind: 'tab' });
  assert.deepEqual(parseDeepLink(`${origin}/jogos`, origin), { tab: 'profile', kind: 'profile-section', section: 'games' });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sanitizeMobileReadData } from '../src/lib/mobile/data.ts';

test('mobile arena data omits catalog photos without documented distribution rights', () => {
  const result = sanitizeMobileReadData({
    kind: 'arenas',
    arenas: [{
      id: 'arena',
      image: '/images/arenas/catalog.webp',
      directory: { photos: [{ src: '/images/arenas/catalog.webp' }], sourceUrl: 'https://example.test' },
    }],
    sports: [],
    hasMore: false,
    offset: 0,
  });
  assert.equal(result.arenas[0].image, null);
  assert.deepEqual(result.arenas[0].directory.photos, []);
});

test('mobile arena data keeps an authorized owner-uploaded cover', () => {
  const result = sanitizeMobileReadData({
    kind: 'arena',
    arena: {
      id: 'arena',
      image: '/api/media?bucket=entity-media&path=owner.webp',
      directory: { photos: [{ src: '/images/arenas/catalog.webp' }] },
    },
  });
  assert.match(result.arena.image, /^\/api\/media/);
  assert.deepEqual(result.arena.directory.photos, []);
});

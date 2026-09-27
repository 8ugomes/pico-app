import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createDraftRepository,
  draftStorageKey,
} from '../apps/mobile/drafts.ts';

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const POST_KEY = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

class MemoryPreferences {
  values = new Map();

  async get({ key }) {
    return { value: this.values.get(key) ?? null };
  }

  async set({ key, value }) {
    this.values.set(key, value);
  }

  async remove({ key }) {
    this.values.delete(key);
  }
}

test('rascunho fica isolado por conta e preserva a chave idempotente em outra instância', async () => {
  const storage = new MemoryPreferences();
  const firstLaunch = createDraftRepository(storage);
  const publication = {
    idempotencyKey: POST_KEY,
    body: 'Treino de sábado',
    audience: 'beta',
    wallArena: '',
    groups: [],
    mediaKind: 'photo',
    imagePath: null,
    videoPath: null,
    refreshToken: 'não-deve-ser-persistido',
  };

  await firstLaunch.savePublication(ALICE, publication);

  const relaunched = createDraftRepository(storage);
  assert.deepEqual(await relaunched.loadPublication(ALICE), {
    idempotencyKey: POST_KEY,
    body: 'Treino de sábado',
    audience: 'beta',
    wallArena: '',
    groups: [],
    mediaKind: 'photo',
    imagePath: null,
    videoPath: null,
  });
  assert.equal(await relaunched.loadPublication(BOB), null);
  assert.match(storage.values.get(draftStorageKey(ALICE, 'publication')), /Treino de sábado/);
  assert.doesNotMatch(storage.values.get(draftStorageKey(ALICE, 'publication')), /accessToken|refreshToken|password/i);
});

test('confirmação só apaga o rascunho correspondente à mesma tentativa', async () => {
  const storage = new MemoryPreferences();
  const drafts = createDraftRepository(storage);
  const game = {
    idempotencyKey: POST_KEY,
    arenaId: '33333333-3333-4333-8333-333333333333',
    sportId: '44444444-4444-4444-8444-444444444444',
    playedOn: '2026-09-18',
  };

  await drafts.saveGame(ALICE, game);
  assert.equal(await drafts.confirmGame(ALICE, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), false);
  assert.deepEqual(await drafts.loadGame(ALICE), game);

  assert.equal(await drafts.confirmGame(ALICE, POST_KEY), true);
  assert.equal(await drafts.loadGame(ALICE), null);
});

test('fila serializa escrita pendente antes da confirmação para não ressuscitar rascunho', async () => {
  class DelayedPreferences extends MemoryPreferences {
    async set(options) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      await super.set(options);
    }
  }

  const storage = new DelayedPreferences();
  const drafts = createDraftRepository(storage);
  const publication = {
    idempotencyKey: POST_KEY,
    body: 'Uma tentativa só',
    audience: 'private',
    wallArena: '',
    groups: ['55555555-5555-4555-8555-555555555555'],
    mediaKind: 'photo',
    imagePath: null,
    videoPath: null,
  };

  const saving = drafts.savePublication(ALICE, publication);
  const confirming = drafts.confirmPublication(ALICE, POST_KEY);
  await Promise.all([saving, confirming]);

  assert.equal(await drafts.loadPublication(ALICE), null);
});

test('edição de perfil é retomável e guarda somente campos públicos do formulário', async () => {
  const storage = new MemoryPreferences();
  const drafts = createDraftRepository(storage);
  const profile = {
    avatarPath: `${ALICE}/avatar.webp`,
    name: 'Alice da Areia',
    username: 'alice_areia',
    bio: 'Futevôlei no fim de tarde.',
    city: 'Santos',
    neighborhood: 'Gonzaga',
    sportId: '44444444-4444-4444-8444-444444444444',
    level: 'Intermediário',
    accessToken: 'não-deve-ser-persistido',
  };

  await drafts.saveProfile(ALICE, profile);
  assert.deepEqual(await createDraftRepository(storage).loadProfile(ALICE), {
    avatarPath: `${ALICE}/avatar.webp`,
    name: 'Alice da Areia',
    username: 'alice_areia',
    bio: 'Futevôlei no fim de tarde.',
    city: 'Santos',
    neighborhood: 'Gonzaga',
    sportId: '44444444-4444-4444-8444-444444444444',
    level: 'Intermediário',
  });
  assert.doesNotMatch(storage.values.get(draftStorageKey(ALICE, 'profile')), /accessToken|refreshToken|password/i);
  await drafts.clearProfile(ALICE);
  assert.equal(await drafts.loadProfile(ALICE), null);
});

test('exclusão de conta solicita a limpeza dos rascunhos e do guia locais', async () => {
  const [state, api, screens] = await Promise.all([
    readFile(new URL('../apps/mobile/local-state.ts', import.meta.url), 'utf8'),
    readFile(new URL('../apps/mobile/api.ts', import.meta.url), 'utf8'),
    readFile(new URL('../apps/mobile/screens.tsx', import.meta.url), 'utf8'),
  ]);
  for (const kind of ['publication', 'game', 'profile']) assert.match(state, new RegExp(`draftStorageKey\\(accountId, '${kind}'\\)`));
  assert.match(state, /pico\.mobile\.tour\.v1\.\$\{accountId\}/);
  assert.match(api, /async wipe\(clearLocalContent = false, notice\?: string\)/);
  assert.match(api, /clearAccountLocalContent\(accountId\)/);
  assert.match(state, /readRememberedAccount/);
  assert.match(state, /markAccountDeletionIntent/);
  assert.match(state, /pico\.mobile\.comment-attempts\.v1/);
  assert.match(state, /pico\.mobile\.game-share-attempts\.v1/);
  assert.match(screens, /api\.wipe\(true\)/);
});

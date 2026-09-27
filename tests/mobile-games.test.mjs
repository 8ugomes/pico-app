import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { parseMobileGameMutation } from '../src/lib/mobile/games.ts';

const validShare = () => ({
  action: 'share',
  id: randomUUID(),
  version: 1,
  key: randomUUID(),
  body: 'Jogo bom na areia.',
  imagePath: null,
  videoPath: null,
  audience: 'beta',
  wallArena: null,
  groups: [],
});

test('mobile game sharing is an explicit mutation with an optimistic version and idempotency key', () => {
  const input = validShare();
  assert.deepEqual(parseMobileGameMutation(input), {
    ...input,
    imagePath: undefined,
    videoPath: undefined,
    wallArena: undefined,
  });

  assert.throws(() => parseMobileGameMutation({ ...input, action: 'save' }));
  assert.throws(() => parseMobileGameMutation({ ...input, version: undefined }));
  assert.throws(() => parseMobileGameMutation({ ...input, playedOn: '2026-09-18' }));
});

test('mobile game sharing accepts photos while the iOS video capability remains disabled', () => {
  const input = validShare();
  const owner = randomUUID();
  const asset = randomUUID();
  const imagePath = `${owner}/${asset}.webp`;
  const videoPath = `${owner}/${asset}.mp4`;

  assert.equal(parseMobileGameMutation({ ...input, imagePath }).imagePath, imagePath);
  assert.throws(() => parseMobileGameMutation({ ...input, videoPath }));
  assert.throws(() => parseMobileGameMutation({ ...input, imagePath, videoPath }));
  assert.throws(() => parseMobileGameMutation({ ...input, imagePath: `${owner}/${asset}.jpg` }));
  assert.throws(() => parseMobileGameMutation({ ...input, videoPath: `${owner}/${asset}.mov` }));
});

test('mobile games route delegates sharing to the snapshot RPC without changing save or delete', async () => {
  const route = await readFile(new URL('../src/app/api/mobile/v1/games/route.ts', import.meta.url), 'utf8');

  assert.match(route, /parseMobileGameMutation/);
  assert.match(route, /input\.action === 'share'/);
  assert.match(route, /client\.rpc\('share_played_game_media'/);
  assert.match(route, /p_version: input\.version/);
  assert.match(route, /p_key: input\.key/);
  assert.match(route, /p_image_path: input\.imagePath/);
  assert.match(route, /p_video_path: input\.videoPath/);
  assert.match(route, /postId: result\.data/);
  assert.match(route, /client\.rpc\('save_played_game'/);
  assert.match(route, /client\.rpc\('delete_played_game'/);
});

test('cliente persiste a chave de compartilhamento até a confirmação', async () => {
  const screens = await readFile(new URL('../apps/mobile/screens.tsx', import.meta.url), 'utf8');
  assert.match(screens, /attempts\.saveGameShare/);
  assert.match(screens, /attempts\.loadGameShare/);
  assert.match(screens, /attempts\.confirmGameShare/);
});

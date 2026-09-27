import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  POST_VIDEO_LIMIT,
  parseMobileVideoUploadMutation,
  resolveMobileVideoUploadTarget,
} from '../src/lib/mobile/video-upload-contract.ts';

const owner = '11111111-1111-4111-8111-111111111111';
const path = `${owner}/22222222-2222-4222-8222-222222222222.mp4`;

test('mobile video upload exposes only an exact direct Storage endpoint and a publishable key', () => {
  const jwt = (role) => [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ role })).toString('base64url'),
    'signature',
  ].join('.');
  assert.deepEqual(
    resolveMobileVideoUploadTarget(
      'https://project-ref.supabase.co',
      'sb_publishable_public-value',
    ),
    {
      endpoint: 'https://project-ref.storage.supabase.co/storage/v1/upload/resumable/sign',
      publishableKey: 'sb_publishable_public-value',
    },
  );
  assert.equal(resolveMobileVideoUploadTarget('https://project-ref.supabase.co', jwt('anon')).publishableKey, jwt('anon'));

  for (const url of [
    'http://project-ref.supabase.co',
    'https://project-ref.storage.supabase.co',
    'https://user:password@project-ref.supabase.co',
    'https://project-ref.supabase.co/rest/v1',
    'https://project-ref.supabase.co?token=value',
    'https://example.com',
  ]) {
    assert.throws(() => resolveMobileVideoUploadTarget(url, 'sb_publishable_public-value'));
  }
  for (const key of ['sb_secret_private-value', 'service-role', jwt('service_role'), '', 'sb_publishable_bad value']) {
    assert.throws(() => resolveMobileVideoUploadTarget('https://project-ref.supabase.co', key));
  }
});

test('mobile video upload mutations enforce exact fields, MP4 paths and the 45 MiB ceiling', () => {
  assert.deepEqual(parseMobileVideoUploadMutation({ action: 'reserve', size: POST_VIDEO_LIMIT }), {
    action: 'reserve',
    size: POST_VIDEO_LIMIT,
  });
  assert.deepEqual(parseMobileVideoUploadMutation({ action: 'reserve', size: 32, path }), {
    action: 'reserve',
    size: 32,
    path,
  });
  assert.deepEqual(parseMobileVideoUploadMutation({ action: 'finalize', size: 32, path }), {
    action: 'finalize',
    size: 32,
    path,
  });
  assert.deepEqual(parseMobileVideoUploadMutation({ action: 'delete', path }), {
    action: 'delete',
    path,
  });

  for (const body of [
    { action: 'reserve', size: 31 },
    { action: 'reserve', size: POST_VIDEO_LIMIT + 1 },
    { action: 'reserve', size: 32, secret: 'never' },
    { action: 'finalize', size: 32, path: '../escape.mp4' },
    { action: 'delete', path, size: 32 },
    { action: 'unknown', path },
  ]) {
    assert.throws(() => parseMobileVideoUploadMutation(body));
  }
});

test('Bearer upload route keeps ownership checks, bounded header inspection and public-only credentials', async () => {
  const route = await readFile(
    new URL('../src/app/api/mobile/v1/video-upload/route.ts', import.meta.url),
    'utf8',
  );

  assert.match(route, /validateMobileRequest\(request\)/);
  assert.match(route, /requireMobileUser/);
  assert.match(route, /\.eq\('player_id', user\.id\)/);
  assert.match(route, /createSignedUploadUrl\(path\)/);
  assert.match(route, /signedVideoRange\(path, 0, 31, size\)/);
  assert.match(route, /isMp4Header\(header\)/);
  assert.match(route, /publishableKey/);
  assert.doesNotMatch(route, /SUPABASE_SECRET_KEY|service[_-]?role/i);
  assert.doesNotMatch(route, /request\.arrayBuffer\(\)/);
});

test('mobile upload component streams MP4 chunks, resumes safely and supports explicit cancellation', async () => {
  const component = await readFile(
    new URL('../apps/mobile/video-upload.tsx', import.meta.url),
    'utf8',
  );

  assert.match(component, /slice\(0, 32\)\.arrayBuffer\(\)/);
  assert.doesNotMatch(component, /file\.arrayBuffer\(\)/);
  assert.match(component, /TUS_CHUNK_SIZE = 6 \* 1024 \* 1024/);
  assert.match(component, /chunkSize:\s*TUS_CHUNK_SIZE/);
  assert.match(component, /retryDelays:\s*\[0, 1000, 3000, 5000\]/);
  assert.match(component, /findPreviousUploads\(\)/);
  assert.match(component, /resumeFromPreviousUpload/);
  assert.match(component, /abort\(true\)/);
  assert.match(component, /action:\s*'delete'/);
  assert.match(component, /credentials are never forwarded|x-signature/i);
});

test('iOS 1.0 keeps new raw-video publishing behind the server and client capability gate', async () => {
  const [features, capabilities, posts, upload, app, screens] = await Promise.all([
    readFile(new URL('../src/lib/mobile/features.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/api/mobile/v1/capabilities/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/api/mobile/v1/posts/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/api/mobile/v1/video-upload/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../apps/mobile/app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../apps/mobile/screens.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(features, /MOBILE_VIDEO_PUBLISHING_ENABLED = false/);
  assert.match(capabilities, /videoPublishing: MOBILE_VIDEO_PUBLISHING_ENABLED/);
  assert.match(posts, /body\.videoPath && !MOBILE_VIDEO_PUBLISHING_ENABLED/);
  assert.match(upload, /if \(!MOBILE_VIDEO_PUBLISHING_ENABLED\)/);
  assert.match(app, /videoPublishing=\{capabilities\?\.features\.videoPublishing === true\}/);
  assert.match(screens, /videoPublishing && <fieldset className="media-choice"/);
  assert.match(screens, /videoPublishing && mediaKind === 'video'/);
});

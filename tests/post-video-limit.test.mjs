import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, ALICE } from './helpers/database.mjs';

const limit = 45 * 1024 * 1024;

test('the private video bucket and asset constraint agree on the 45 MiB boundary', async () => {
  const db = await createTestDatabase();
  try {
    const bucket = (await db.query("select public,file_size_limit,allowed_mime_types from storage.buckets where id='post-videos'")).rows[0];
    assert.equal(bucket.public, false);
    assert.deepEqual(bucket.allowed_mime_types, ['video/mp4']);
    assert.equal(Number(bucket.file_size_limit), limit);
    const path = `${ALICE}/00000000-0000-4000-8000-000000000001.mp4`;
    await db.query('insert into public.post_video_assets(path,player_id,ready,byte_size) values($1,$2,true,$3)', [path, ALICE, limit]);
    await assert.rejects(db.query('update public.post_video_assets set byte_size=$2 where path=$1', [path, limit + 1]), error => error.code === '23514');
  } finally { await db.close(); }
});

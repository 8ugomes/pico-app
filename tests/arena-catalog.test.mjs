import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';
import { arenaCatalog, buildArenaCatalogSql, retiredDemoIds } from '../scripts/arena-catalog-data.mjs';
import { getArenaDirectory } from '../src/lib/arena-catalog.ts';

test('reviewed catalog assets exist, match provenance and never attach to another identity', async () => {
  assert.equal(arenaCatalog.arenas.length, 17);
  for (const a of arenaCatalog.arenas) {
    assert.ok(a.sources.some(s => s.supports.includes('address')));
    assert.ok(a.sources.some(s => s.supports.includes('sports')) || a.sourceUrl === 'https://arenaace.com.br/' || a.sourceUrl === 'https://nossaarenasp.com.br/');
    assert.ok(a.photos.length);
    const dto = getArenaDirectory(a.id, a.slug);
    assert.equal(dto.address, a.address);
    assert.equal(getArenaDirectory(randomUUID(), a.slug), undefined);
    assert.equal(getArenaDirectory(a.id, 'unknown'), undefined);
    for (const photo of a.photos) {
      assert.match(photo.src, /^\/images\/arenas\/[a-z0-9-]+\.webp$/);
      const bytes = readFileSync(new URL('../public' + photo.src, import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256);
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.width, photo.width); assert.equal(metadata.height, photo.height);
      assert.equal(metadata.exif, undefined);
    }
  }
});

test('catalog import is atomic, preserves history and owner edits, creates no fake participation', async () => {
  const db = await createTestDatabase();
  try {
    await asUser(db, BOB, () => db.query('select public.set_arena_membership($1,true)', [VILA]));
    const before = (await db.query('select count(*)::int n from public.communities')).rows[0].n;
    await db.query('insert into public.played_games(id,player_id,arena_id,sport_id,played_on) values($1,$2,$3,$4,$5)', [randomUUID(), BOB, VILA, FUTEVOLEI, '2026-09-01']);
    await db.exec(buildArenaCatalogSql());
    assert.equal((await db.query('select count(*)::int n from public.arena_members')).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int n from public.communities')).rows[0].n, before);
    assert.equal((await db.query('select * from public.played_games where player_id=$1', [BOB])).rows.length, 1);
    for (const id of retiredDemoIds) assert.equal((await db.query('select status from public.arenas where id=$1', [id])).rows[0].status, 'archived');
    const real = arenaCatalog.arenas[0];
    await asUser(db, BOB, async () => {
      assert.equal((await db.query('select id from public.arenas where is_public')).rows.length, 17);
      assert.equal((await db.query('select id from public.arenas where id=$1', [VILA])).rows.length, 0);
      await assert.rejects(db.query('select public.set_arena_membership($1,true)', [VILA]));
      await db.query('select public.set_arena_membership($1,true)', [real.id]);
      await db.query('select public.set_arena_membership($1,true)', [real.id]);
      await assert.rejects(db.query('select public.create_official_community($1)', [real.id]));
      await assert.rejects(db.query("update public.arenas set owner_id=$1 where id=$2", [BOB,real.id]));
    });
    await asUser(db, null, async () => assert.equal((await db.query('select * from public.arenas')).rows.length, 0));
    // Reapplying the directory must not revert a manager's later changes.
    await db.query("update public.arenas set description='Descrição da gestão',owner_id=$1 where id=$2", [ALICE,real.id]);
    await db.query('update public.arena_sports set enabled=false where arena_id=$1', [real.id]);
    await db.exec(buildArenaCatalogSql());
    assert.equal((await db.query('select description from public.arenas where id=$1', [real.id])).rows[0].description, 'Descrição da gestão');
    assert.ok((await db.query('select enabled from public.arena_sports where arena_id=$1', [real.id])).rows.every(s => !s.enabled));
    assert.equal((await db.query('select * from public.arena_members where arena_id=$1 and player_id=$2',[real.id,BOB])).rows.length,1);
  } finally { await db.close(); }
});

test('a real directory arena can be claimed only through review and has one official community', async () => {
  const db = await createTestDatabase();
  try {
    await db.exec(buildArenaCatalogSql());
    await db.query("insert into pico_private.platform_grants(player_id,role) values($1,'admin')", [ALICE]);
    const arena = arenaCatalog.arenas[0]; let request;
    await asUser(db, BOB, async () => {
      request = (await db.query("select public.request_arena('claim',$1,$2) id", [arena.id,{name:arena.name,city:arena.city,neighborhood:arena.neighborhood,details:'Teste de revisão'}])).rows[0].id;
      assert.equal((await db.query('select owner_id from public.arenas where id=$1',[arena.id])).rows[0].owner_id,null);
      await assert.rejects(db.query('select public.review_arena_request($1,true)',[request]));
    });
    await asUser(db, ALICE, () => db.query('select public.review_arena_request($1,true)',[request]));
    await asUser(db, BOB, async () => {
      const create = () => db.query('select public.create_official_community($1) id',[arena.id]);
      const one = (await create()).rows[0].id;
      assert.equal((await create()).rows[0].id,one);
      assert.equal((await db.query('select owner_id from public.communities where id=$1',[one])).rows[0].owner_id,BOB);
    });
  } finally { await db.close(); }
});

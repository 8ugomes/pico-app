import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestDatabase, asUser, ALICE, BOB, FUTEVOLEI } from './helpers/database.mjs';

// Exercise an upgrade with existing memberships and content, not only a fresh DB.
test('editorial upgrade preserves community identity, content, manager edits and protection', async () => {
  const db = await createTestDatabase({ through: '20260913230000_arena_directory_search.sql' });
  try {
    const migration = await readFile(new URL('../supabase/migrations/20260913233000_natural_product_copy.sql', import.meta.url), 'utf8');
    const catalog = JSON.parse(await readFile(new URL('../src/data/arena-catalog.json', import.meta.url), 'utf8'));
    const venues = catalog.arenas.filter(a => ['nossa-arena', 'arena-nacional-caraguatatuba-caraguatatuba'].includes(a.slug));
    for (const [i, arena] of venues.entries()) {
      const oldInfo = [arena.address.replace(' (acesso à rua sem saída, 200)', ' — acesso à rua sem saída, 200').replace(' (Serramar Shopping)', ' — Serramar Shopping'), arena.note].join('\n');
      await db.query('insert into public.arenas(id,slug,name,city,neighborhood,public_info) values($1,$2,$3,$4,$5,$6)',
        [arena.id, arena.slug, arena.name, arena.city, arena.neighborhood, i === 0 ? oldInfo : 'Texto da gestão — preservar.']);
    }
    await asUser(db, ALICE, async () => {
      await db.query("select public.save_profile('Jogador teste','jogador_teste','','','',$1,'Iniciante',false)", [FUTEVOLEI]);
      await db.query('select public.ensure_pico_membership()');
    });
    const official = (await db.query('select c.* from public.communities c join pico_private.pico_community p on c.id=p.community_id')).rows[0];
    await db.query('insert into public.posts(author_id,body) values($1,$2)', [ALICE, 'Meu texto — minha escrita.']);
    const tables = ['public.posts', 'public.profiles', 'public.community_members', 'pico_private.pico_welcomes', 'pico_private.pico_editorial'];
    const snapshot = async () => Promise.all(tables.map(t => db.query(`select * from ${t}`)));
    const before = await snapshot();
    const migratedVenueBefore = (await db.query('select * from public.arenas where id=$1', [venues[0].id])).rows[0];
    const editedVenueBefore = (await db.query('select * from public.arenas where id=$1', [venues[1].id])).rows[0];
    await db.exec(migration);
    const after = (await db.query('select * from public.communities where id=$1', [official.id])).rows[0];
    assert.deepEqual(after, { ...official, name: 'Comunidade oficial do Pico', version: official.version + 1 });
    assert.deepEqual(await snapshot(), before);
    const migratedVenueAfter = (await db.query('select * from public.arenas where id=$1', [venues[0].id])).rows[0];
    assert.deepEqual(migratedVenueAfter, { ...migratedVenueBefore, public_info: [venues[0].address, venues[0].note].join('\n'), version: migratedVenueBefore.version + 1 });
    assert.deepEqual((await db.query('select * from public.arenas where id=$1', [venues[1].id])).rows[0], editedVenueBefore);
    await db.exec(migration);
    assert.deepEqual((await db.query('select * from public.communities where id=$1', [official.id])).rows[0], after);
    assert.deepEqual((await db.query('select * from public.arenas where id=$1', [venues[0].id])).rows[0], migratedVenueAfter);
    assert.equal((await db.query("select tgenabled from pg_trigger where tgname='protect_pico_community'")).rows[0].tgenabled, 'O');
    await db.query('select public.bootstrap_operator($1)', [BOB]);
    await asUser(db, BOB, async () => {
      await assert.rejects(db.query("update public.communities set name='Outro nome' where id=$1", [official.id]), e => e.code === '42501');
    });
    await assert.rejects(db.query("update public.communities set name='Outro nome' where id=$1", [official.id]), e => e.code === '23514');
    await asUser(db, ALICE, async () => {
      const welcome = (await db.query('select public.pico_welcome() w')).rows[0].w;
      const page = (await db.query("select public.community_page('pico-oficial') p")).rows[0].p;
      const directory = (await db.query("select public.community_directory('Comunidade oficial do Pico') d")).rows[0].d;
      assert.equal(welcome.id, official.id);
      assert.equal(welcome.name, after.name);
      assert.equal(page.id, official.id);
      assert.equal(page.name, after.name);
      assert.equal(directory[0].id, official.id);
      assert.equal(directory[0].name, after.name);
    });
  } finally { await db.close(); }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestDatabase } from './helpers/database.mjs';

const migration = new URL('../supabase/migrations/20260914133000_west_sp_arenas.sql', import.meta.url);
const expected = [
  ['r7-academia', 'R7 Academia', 'Jaraguá', ['futevolei', 'volei-praia']],
  ['arena-xfield', 'Arena Xfield', 'Vila Clarice', ['futevolei', 'beach-tennis', 'volei-praia']],
  ['jaragua-clube-campestre', 'Jaraguá Clube Campestre', 'Pirituba', ['beach-tennis']],
];

test('Zona Oeste catalog adds only verified missing venues and modalities, idempotently', async () => {
  const db = await createTestDatabase({ through: '20260914132000_arena_played_marks.sql' });
  try {
    const before = (await db.query("select id, name from public.arenas where slug = 'areia-da-vila'")).rows[0];
    const sql = await readFile(migration, 'utf8');
    await db.exec(sql);
    await db.exec(sql);
    const rows = (await db.query(`
      select a.slug, a.name, a.neighborhood, a.city, a.is_demo, a.owner_id,
        coalesce(array_agg(s.slug::text order by s.slug::text) filter (where x.enabled), '{}') sports
      from public.arenas a
      left join public.arena_sports x on x.arena_id = a.id
      left join public.sports s on s.id = x.sport_id
      where a.slug = any($1)
      group by a.id order by a.slug
    `, [expected.map(x => x[0])])).rows;
    assert.equal(rows.length, expected.length);
    for (const [slug, name, neighborhood, sports] of expected) {
      const row = rows.find(x => x.slug === slug);
      assert.equal(row.name, name);
      assert.equal(row.city, 'São Paulo');
      assert.equal(row.neighborhood, neighborhood);
      assert.equal(row.is_demo, false);
      assert.equal(row.owner_id, null);
      assert.deepEqual(row.sports, sports.toSorted());
    }
    assert.equal((await db.query("select count(*)::int n from public.arenas where slug = 'arena-jaragua-beach'")).rows[0].n, 0);
    assert.equal((await db.query("select count(*)::int n from public.arenas where name in ('Nossa Ksa Beach Sports', 'Estação Sal Beach')")).rows[0].n, 0);
    assert.deepEqual((await db.query("select id, name from public.arenas where slug = 'areia-da-vila'")).rows[0], before);
  } finally { await db.close(); }
});

test('migration leaves a same-name preexisting arena untouched', async () => {
  const db = await createTestDatabase({ through: '20260914132000_arena_played_marks.sql' });
  try {
    await db.query(`insert into public.arenas(slug, name, city, neighborhood, description)
      values('r7-ja-cadastrada', 'R7 Academia', 'São Paulo', 'Jaraguá', 'Descrição mantida')`);
    await db.exec(await readFile(migration, 'utf8'));
    const rows = (await db.query("select slug, description from public.arenas where lower(name) = lower('R7 Academia')")).rows;
    assert.deepEqual(rows, [{ slug: 'r7-ja-cadastrada', description: 'Descrição mantida' }]);
  } finally { await db.close(); }
});

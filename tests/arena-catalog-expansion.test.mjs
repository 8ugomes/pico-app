import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestDatabase } from './helpers/database.mjs';

test('2026-11 catalog expansion is idempotent, public, ownerless and sport-linked', async () => {
  const db = await createTestDatabase();
  try {
    const sql = await readFile(new URL('../supabase/migrations/20261106101000_arena_catalog_expansion.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    const rows = (await db.query("select a.slug, a.is_public, a.is_demo, a.owner_id, count(x.sport_id)::int sports from public.arenas a left join public.arena_sports x on x.arena_id = a.id where a.slug in ('playa-sp-beach-sports','arena-vinci-esportes-na-areia','hg-beach-guarulhos') group by a.id order by a.slug")).rows;
    assert.deepEqual(rows.map(r => [r.slug, r.sports]), [['arena-vinci-esportes-na-areia', 2], ['hg-beach-guarulhos', 3], ['playa-sp-beach-sports', 2]]);
    assert.ok(rows.every(r => r.is_public && !r.is_demo && r.owner_id === null));
    const total = (await db.query('select count(*)::int n from public.arenas')).rows[0].n;
    await db.exec(sql);
    assert.equal((await db.query('select count(*)::int n from public.arenas')).rows[0].n, total);
  } finally { await db.close(); }
});

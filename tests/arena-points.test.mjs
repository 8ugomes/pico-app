import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, FUTEVOLEI } from './helpers/database.mjs';

test('arena points weigh actions, cap per day, ignore self-interaction and follow deletions', async () => {
  const db = await createTestDatabase();
  const arena = randomUUID();
  try {
    await db.query("insert into public.arenas(id,slug,name,city,neighborhood) values($1,'arena-pontos','Arena pontos','São Paulo','Teste')", [arena]);
    await db.query('insert into public.arena_sports(arena_id,sport_id) values($1,$2)', [arena, FUTEVOLEI]);
    await db.query('update public.profiles set onboarding_completed = true where id in ($1,$2)', [ALICE, BOB]);
    const posts = [];
    for (let i = 0; i < 4; i++) {
      const id = randomUUID(); posts.push(id);
      await db.query("insert into public.posts(id,author_id,arena_id,sport_id,body) values($1,$2,$3,$4,'Jogo bom')", [id, ALICE, arena, FUTEVOLEI]);
    }
    await db.query("insert into public.comments(post_id,author_id,body) values($1,$2,'Boa'),($1,$3,'Valeu')", [posts[0], BOB, ALICE]);
    await db.query('insert into public.post_likes(post_id,player_id) values($1,$2)', [posts[0], BOB]);
    await db.query('insert into public.post_likes(post_id,player_id) values($1,$2)', [posts[1], ALICE]);
    await asUser(db, ALICE, async () => { await db.query('select public.record_arena_checkin($1)', [arena]); });
    await asUser(db, BOB, async () => {
      const r = (await db.query("select public.read_arena_points($1,'all') r", [arena])).rows[0].r;
      assert.deepEqual(r.entries.map(e => [e.player_id, e.rank, e.points]), [[ALICE, 1, 12], [BOB, 2, 2]]);
      assert.equal(r.breakdown.comment.points, 1);
      assert.equal(r.breakdown.like_given.points, 1);
      assert.equal(r.breakdown.like_received, undefined);
      assert.deepEqual(r.me, { rank: 2, points: 2, all_points: 2 });
    });
    await asUser(db, ALICE, async () => {
      const r = (await db.query("select public.read_arena_points($1,'week') r", [arena])).rows[0].r;
      assert.equal(r.me.points, 12);
      assert.equal(r.breakdown.post.points, 6);
      assert.equal(r.breakdown.post.count, 3);
    });
    await db.query('delete from public.post_likes');
    await db.query('update public.comments set moderated_at = now()');
    await asUser(db, BOB, async () => {
      const r = (await db.query("select public.read_arena_points($1,'all') r", [arena])).rows[0].r;
      assert.deepEqual(r.entries.map(e => [e.player_id, e.points]), [[ALICE, 11]]);
      assert.deepEqual(r.me, { rank: null, points: 0, all_points: 0 });
    });
    await db.query("update public.posts set moderated_at = now() where id = any($1)", [[posts[0], posts[1]]]);
    await asUser(db, BOB, async () => {
      assert.equal((await db.query("select public.read_arena_points($1,'all') r", [arena])).rows[0].r.entries[0].points, 9);
      await assert.rejects(db.query("select public.read_arena_points($1,'year')", [arena]), e => e.code === '23514');
      await assert.rejects(db.query('select * from pico_private.arena_scored_events($1)', [arena]), e => e.code === '42501');
    });
  } finally { await db.close(); }
});

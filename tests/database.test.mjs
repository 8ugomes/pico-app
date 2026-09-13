import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI, BEACH, PRIVATE } from './helpers/database.mjs';
let db;
let postId;
let privatePostId;
before(async () => {
  db = await createTestDatabase();
  privatePostId = (await db.query('insert into posts (author_id, arena_id, sport_id, body) values ($1,$2,$3,$4) returning id', [BOB,PRIVATE,FUTEVOLEI,'Não deve aparecer'])).rows[0].id;
});
after(async () => { await db?.close(); });
const denied = (promise) => assert.rejects(promise, e => e.code === '42501');
const invalid = (promise) => assert.rejects(promise, e => ['23503','23514','23505'].includes(e.code));

test('foundation applies with RLS on every exposed table and seed is idempotent', async () => {
  const tables = (await db.query(`select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`)).rows;
  assert.ok(tables.length >= 15);
  assert.ok(tables.every(t => t.relrowsecurity));
  assert.equal((await db.query('select * from sports')).rows.length,3);
  const demo = (await db.query('select * from arenas where is_demo')).rows;
  assert.equal(demo.length,3);
  assert.ok(demo.every(a => a.description.includes('fictícia')));
  assert.equal((await db.query('select * from arena_sports where arena_id <> $1',[PRIVATE])).rows.length,7);
});

test('signup trigger uses auth identity, ignores role/username claims and backfills existing users', async () => {
  const profiles = (await db.query('select * from profiles order by id')).rows;
  assert.equal(profiles.length,3);
  const alice = profiles.find(p => p.id === ALICE);
  assert.equal(alice.display_name,'Alice Teste');
  assert.equal(alice.username,`pico_${ALICE.replaceAll('-','')}`);
  assert.equal(alice.is_demo,false);
  assert.equal(alice.available,false);
  assert.ok(profiles.every(p => !('email' in p) && !('role' in p)));
  await db.query(`insert into auth.users (id, raw_user_meta_data) values ('30000000-0000-4000-8000-000000000003', $1)`,[JSON.stringify({display_name:{bad:'object'}})]);
  assert.equal((await db.query(`select display_name from profiles where id='30000000-0000-4000-8000-000000000003'`)).rows[0].display_name, 'Novo jogador');
  await asUser(db, ALICE, async () => { await denied(db.query('select public.handle_new_user()')); });
});

test('anonymous cannot read the internal catalog or social data', async () => {
  await asUser(db, null, async () => {
    assert.equal((await db.query('select * from arenas')).rows.length,0);
    assert.equal((await db.query('select * from arena_sports')).rows.length,0);
    for (const table of ['profiles','posts','post_likes','comments','checkins','player_sports','arena_members']) await denied(db.query(`select * from ${table}`));
    await denied(db.query(`insert into sports(slug,name) values ('futevolei','Fake')`));
    await denied(db.query('insert into posts (author_id,arena_id,sport_id,body) values ($1,$2,$3,$4)',[ALICE,VILA,FUTEVOLEI,'Forged']));
  });
});

test('profile edits only affect the caller and immutable fields cannot be reassigned', async () => {
  await asUser(db, ALICE, async () => {
    assert.equal((await db.query('update profiles set bio=$1 where id=$2 returning id',['Minha bio',ALICE])).rows.length,1);
    assert.equal((await db.query('update profiles set bio=$1 where id=$2 returning id',['Invadida',BOB])).rows.length,0);
    await denied(db.query('update profiles set id=$1 where id=$2',[BOB,ALICE]));
    await denied(db.query('update profiles set is_demo=true where id=$1',[ALICE]));
    await denied(db.query('delete from profiles where id=$1',[ALICE]));
    await invalid(db.query(`update profiles set username='Email@Example.com' where id=$1`,[ALICE]));
    await invalid(db.query('update profiles set bio=$1 where id=$2',['x'.repeat(161),ALICE]));
    await invalid(db.query('update profiles set username=(select username from profiles where id=$1) where id=$2',[BOB,ALICE]));
  });
});

test('sports and arena membership preserve ownership, validity and one primary sport', async () => {
  await asUser(db, ALICE, async () => {
    await db.query('insert into player_sports(sport_id,is_primary) values ($1,true)',[FUTEVOLEI]);
    await invalid(db.query('insert into player_sports(sport_id,is_primary) values ($1,true)',[BEACH]));
    await denied(db.query('insert into player_sports(player_id,sport_id) values ($1,$2)',[BOB,BEACH]));
    await db.query('select public.set_arena_membership($1,true)',[VILA]);
    await denied(db.query('insert into arena_members(arena_id,player_id) values ($1,$2)',[VILA,BOB]));
    await denied(db.query('insert into arena_members(arena_id) values ($1)',[PRIVATE]));
    await invalid(db.query('insert into player_sports(sport_id) values ($1)',['99999999-0000-4000-8000-000000000000']));
  });
  await asUser(db, BOB, async () => {
    await denied(db.query('delete from arena_members where player_id=$1 returning *',[ALICE]));
    assert.equal((await db.query(`update player_sports set level='Avançado' where player_id=$1 returning *`,[ALICE])).rows.length,0);
  });
});

test('posts derive default authorship, reject forged author/arena/sport and protect timestamps', async () => {
  await asUser(db, ALICE, async () => {
    const post = (await db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3) returning *',[VILA,FUTEVOLEI,'Bora jogar?'])).rows[0];
    postId = post.id;
    assert.equal(post.author_id,ALICE);
    await denied(db.query('insert into posts(author_id,arena_id,sport_id,body) values ($1,$2,$3,$4)',[BOB,VILA,FUTEVOLEI,'Autoria forjada']));
    await denied(db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[PRIVATE,FUTEVOLEI,'Arena privada']));
    await invalid(db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[VILA,BEACH,'Esporte inválido']));
    await invalid(db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[VILA,FUTEVOLEI,' '.repeat(10)]));
    await invalid(db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[VILA,FUTEVOLEI,'x'.repeat(501)]));
    await denied(db.query('update posts set author_id=$1 where id=$2',[BOB,postId]));
    await denied(db.query(`update posts set created_at=now() + interval '1 day' where id=$1`,[postId]));
    assert.equal((await db.query('update posts set body=$1 where id=$2 returning id',['Atualizado',postId])).rows.length,1);
  });
  await asUser(db, BOB, async () => {
    assert.equal((await db.query('update posts set body=$1 where id=$2 returning id',['Ataque',postId])).rows.length,0);
    assert.equal((await db.query('delete from posts where id=$1 returning id',[postId])).rows.length,0);
  });
});

test('likes/comments are own-only, reject duplicates and inherit post visibility', async () => {
  await asUser(db, ALICE, async () => {
    await db.query('insert into post_likes(post_id) values ($1)',[postId]);
    await invalid(db.query('insert into post_likes(post_id) values ($1)',[postId]));
    await denied(db.query('insert into post_likes(post_id,player_id) values ($1,$2)',[postId,BOB]));
    await denied(db.query('insert into post_likes(post_id) values ($1)',[privatePostId]));
    const comment = (await db.query('insert into comments(post_id,body) values ($1,$2) returning *',[postId,'Vamos!'])).rows[0];
    assert.equal(comment.author_id,ALICE);
    await denied(db.query('insert into comments(post_id,author_id,body) values ($1,$2,$3)',[postId,BOB,'Forjado']));
    await denied(db.query('insert into comments(post_id,body) values ($1,$2)',[privatePostId,'Privado']));
    await invalid(db.query('insert into comments(post_id,body) values ($1,$2)',[postId,'x'.repeat(281)]));
    await invalid(db.query('insert into comments(post_id,body) values ($1,$2)',[postId,' \n\t '] ));
    await denied(db.query('update comments set author_id=$1 where id=$2',[BOB,comment.id]));
    assert.equal((await db.query('update comments set body=$1 where id=$2 returning id',['Até já',comment.id])).rows.length,1);
  });
  await asUser(db, BOB, async () => {
    assert.equal((await db.query('delete from post_likes where player_id=$1 returning *',[ALICE])).rows.length,0);
    assert.equal((await db.query('update comments set body=$1 where author_id=$2 returning *',['Invadido',ALICE])).rows.length,0);
    assert.equal((await db.query('delete from comments where author_id=$1 returning *',[ALICE])).rows.length,0);
  });
  await asUser(db, ALICE, async () => {
    assert.equal((await db.query('delete from post_likes where post_id=$1 returning *',[postId])).rows.length,1);
    await db.query('insert into post_likes(post_id) values ($1)',[postId]);
  });
});

test('making an arena private hides its posts, comments, likes, membership and sports', async () => {
  await db.query('update arenas set is_public=false where id=$1',[VILA]);
  await asUser(db, BOB, async () => {
    for (const query of ['select * from posts where id=$1','select * from post_likes where post_id=$1','select * from comments where post_id=$1']) assert.equal((await db.query(query,[postId])).rows.length,0);
    for (const table of ['arena_members','arena_sports']) assert.equal((await db.query(`select * from ${table} where arena_id=$1`,[VILA])).rows.length,0);
  });
  await db.query('update arenas set is_public=true where id=$1',[VILA]);
});

test('retired checkin rows preserve legacy constraints and deny direct client access', async () => {
  await asUser(db, ALICE, async () => {
    await denied(db.query(`insert into checkins(player_id,arena_id,sport_id,expires_at) values ($1,$2,$3,now()+interval '2 hours')`,[ALICE,VILA,FUTEVOLEI]));
    await denied(db.query('update checkins set ended_at=now() where player_id=$1',[ALICE]));
    await denied(db.query('delete from checkins where player_id=$1',[ALICE]));
  });
  await invalid(db.query(`insert into checkins(player_id,arena_id,sport_id,expires_at) values ($1,$2,$3,now()+interval '3 hours')`,[ALICE,VILA,FUTEVOLEI]));
  await invalid(db.query(`insert into checkins(player_id,arena_id,sport_id,expires_at) values ($1,$2,$3,now()+interval '2 hours')`,[ALICE,VILA,BEACH]));
  await db.query(`insert into checkins(player_id,arena_id,sport_id,expires_at) values ($1,$2,$3,now()+interval '2 hours')`,[ALICE,VILA,FUTEVOLEI]);
  await invalid(db.query(`insert into checkins(player_id,arena_id,sport_id,expires_at) values ($1,$2,$3,now()+interval '2 hours')`,[ALICE,VILA,FUTEVOLEI]));
  await db.query(`insert into checkins(player_id,arena_id,sport_id,started_at,expires_at) values ($1,$2,$3,now()-interval '3 hours',now()-interval '1 hour')`,[BOB,VILA,FUTEVOLEI]);
  await asUser(db, BOB, async () => { await denied(db.query('select * from checkins')); });
  await db.query('update checkins set ended_at=now() where player_id=$1',[ALICE]);
  await asUser(db, ALICE, async () => { await denied(db.query('select * from checkins')); });
});

test('deleting your post cascades its likes/comments without deleting other authors', async () => {
  await asUser(db, ALICE, async () => { assert.equal((await db.query('delete from posts where id=$1 returning *',[postId])).rows.length,1); });
  assert.equal((await db.query('select * from post_likes where post_id=$1',[postId])).rows.length,0);
  assert.equal((await db.query('select * from comments where post_id=$1',[postId])).rows.length,0);
  assert.equal((await db.query('select * from posts where id=$1',[privatePostId])).rows.length,1);
});

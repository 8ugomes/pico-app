import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';
const denied = promise => assert.rejects(promise,e=>e.code==='42501');
const invalid = promise => assert.rejects(promise,e=>e.code==='23514');

test('blocking is bilateral across profiles, posts, presence and interactions; unblocking does not reconnect', async () => {
  const db=await createTestDatabase();
  for(const uid of [ALICE,BOB]) await asUser(db,uid,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
  try {
    const post=await asUser(db,ALICE,async()=>{
      await db.query('insert into connections(followed_id) values ($1)',[BOB]);
      await db.query('select start_checkin($1,$2)',[VILA,FUTEVOLEI]);
      return (await db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3) returning id',[VILA,FUTEVOLEI,'Na areia'])).rows[0].id;
    });
    await asUser(db,BOB,async()=>{
      await db.query('insert into connections(followed_id) values ($1)',[ALICE]);
      await db.query('insert into comments(post_id,body) values ($1,$2)',[post,'Vamos!']);
      await db.query('insert into blocks(blocked_id) values ($1)',[ALICE]);
      assert.equal((await db.query('select * from blocks')).rows[0].blocked_name,'Alice Teste');
      assert.equal((await db.query('select * from posts where id=$1',[post])).rows.length,0);
      assert.equal((await db.query('select * from profiles where id=$1',[ALICE])).rows.length,0);
      assert.equal((await db.query('select * from checkins where player_id=$1',[ALICE])).rows.length,0);
      await denied(db.query('insert into connections(followed_id) values ($1)',[ALICE]));
      await denied(db.query('insert into post_likes(post_id) values ($1)',[post]));
      await denied(db.query('insert into comments(post_id,body) values ($1,$2)',[post,'Blocked']));
    });
    await asUser(db,ALICE,async()=>{
      assert.equal((await db.query('select * from profiles where id=$1',[BOB])).rows.length,0);
      assert.equal((await db.query('select * from comments where post_id=$1',[post])).rows.length,0);
      assert.equal((await db.query('delete from blocks returning *')).rows.length,0);
    });
    assert.equal((await db.query('select * from connections')).rows.length,0);
    await asUser(db,BOB,()=>db.query('delete from blocks where blocked_id=$1',[ALICE]));
    await asUser(db,BOB,async()=>assert.equal((await db.query('select * from posts where id=$1',[post])).rows.length,1));
    assert.equal((await db.query('select * from connections')).rows.length,0);
  } finally { await db.close(); }
});

test('reports stay private, require visible third-party content, and cannot be forged or moderated by clients', async()=>{
  const db=await createTestDatabase();
  for(const uid of [ALICE,BOB]) await asUser(db,uid,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
  try {
    await asUser(db,BOB,async()=>{
      await db.query('insert into reports(player_id,reason,details) values ($1,$2,$3)',[ALICE,'spam','Teste']);
      assert.equal((await db.query('select * from reports')).rows.length,1);
      await denied(db.query("update reports set status='dismissed'"));
      await denied(db.query('insert into reports(reporter_id,player_id,reason) values ($1,$2,$3)',[ALICE,BOB,'other']));
      await denied(db.query('insert into reports(player_id,reason) values ($1,$2)',[BOB,'other']));
      await assert.rejects(db.query('insert into reports(player_id,reason) values ($1,$2)',[ALICE,'other']),e=>e.code==='23505');
    });
    await asUser(db,ALICE,async()=>assert.equal((await db.query('select * from reports')).rows.length,0));
    await asUser(db,null,()=>denied(db.query('select * from reports')));
  } finally { await db.close(); }
});

test('write limits are enforced in the database even when bypassing the app',async()=>{
  const db=await createTestDatabase();
  for(const uid of [ALICE,BOB]) await asUser(db,uid,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
  try {
    await asUser(db,ALICE,async()=>{
      for(let i=0;i<10;i++) await db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[VILA,FUTEVOLEI,`Post ${i}`]);
      await assert.rejects(db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[VILA,FUTEVOLEI,'Too many']),e=>e.code==='P0429');
      await denied(db.query('delete from pico_private.write_limits'));
      await denied(db.query("select pico_private.consume_write('posts',10000,1)"));
    });
    await asUser(db,BOB,()=>db.query('insert into posts(arena_id,sport_id,body) values ($1,$2,$3)',[VILA,FUTEVOLEI,'Independent quota']));
  } finally { await db.close(); }
});

test('private media requires a ready own reservation; blocks revoke reads and signing is denied',async()=>{
  const db=await createTestDatabase();
  for(const uid of [ALICE,BOB]) await asUser(db,uid,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
  try {
    const path=(await asUser(db,ALICE,()=>db.query("select reserve_media('avatars') as path"))).rows[0].path;
    await asUser(db,ALICE,()=>invalid(db.query('update profiles set avatar_path=$1 where id=$2',[path,ALICE])));
    await db.query('update media_assets set ready=true where path=$1',[path]);
    await db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)",[path]);
    await asUser(db,ALICE,()=>db.query('update profiles set avatar_path=$1 where id=$2',[path,ALICE]));
    await db.query("select set_config('storage.operation','object.get_authenticated',false)");
    await asUser(db,BOB,async()=>{
      assert.equal((await db.query('select * from media_assets')).rows.length,0);
      assert.equal((await db.query('select * from storage.objects')).rows.length,0);
      assert.equal((await db.query("select can_read_media('avatars',$1) as allowed",[path])).rows[0].allowed,true);
      await invalid(db.query('update profiles set avatar_path=$1 where id=$2',[path,BOB]));
      await denied(db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)",[path]));
      assert.equal((await db.query('delete from storage.objects returning *')).rows.length,0);
      await db.query('insert into blocks(blocked_id) values ($1)',[ALICE]);
      assert.equal((await db.query('select * from storage.objects')).rows.length,0);
      assert.equal((await db.query("select can_read_media('avatars',$1) as allowed",[path])).rows[0].allowed,false);
    });
    await db.query("select set_config('storage.operation','object.sign',false)");
    await asUser(db,ALICE,async()=>assert.equal((await db.query('select * from storage.objects')).rows.length,0));
    await asUser(db,BOB,async()=>{
      for(let i=0;i<3;i++) await db.query("select reserve_media('avatars')");
      await assert.rejects(db.query("select reserve_media('avatars')"),e=>e.code==='P0429');
      await denied(db.query('update media_assets set ready=true'));
    });
  } finally { await db.close(); }
});

test('pending account deletion denies social reads and writes including definer RPCs',async()=>{
  const db=await createTestDatabase();
  for(const uid of [ALICE,BOB]) await asUser(db,uid,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
  try {
    await db.query('insert into account_deletions(player_id) values ($1)',[ALICE]);
    await asUser(db,ALICE,async()=>{
      assert.equal((await db.query('select * from profiles')).rows.length,0);
      await denied(db.query('select start_checkin($1,$2)',[VILA,FUTEVOLEI]));
      await denied(db.query("select reserve_media('avatars')"));
      await denied(db.query('delete from account_deletions'));
    });
    await db.query('delete from auth.users where id=$1',[ALICE]);
    assert.equal((await db.query('select * from account_deletions')).rows.length,0);
  } finally { await db.close(); }
});

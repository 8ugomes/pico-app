import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, VILA, PRIVATE } from './helpers/database.mjs';
import { buildArenaCatalogSql } from '../scripts/arena-catalog-data.mjs';

const migration = readFileSync(new URL('../supabase/migrations/20260913210000_preserve_retired_arena_posts.sql', import.meta.url), 'utf8');
const feed = (db, who, args=[]) => asUser(db,who,async()=>(await db.query(`select public.read_repost_feed(${args.map((_,i)=>'$'+(i+1)).join(',')}) r`,args)).rows[0].r);

test('catalog retirement and correction preserve original rows, photos, comments and reposts in all reading contexts', async () => {
  const db=await createTestDatabase({through:'20260913200000_people_community_search.sql'});
  try {
    const path=ALICE+'/'+randomUUID()+'.webp';
    await db.query("insert into public.media_assets(path,player_id,bucket,ready) values($1,$2,'post-media',true)",[path,ALICE]);
    const id=await asUser(db,ALICE,async()=>(await db.query("select public.publish_post($1,'Histórico real',$2,$3) id",[randomUUID(),path,VILA])).rows[0].id);
    await asUser(db,BOB,async()=>{
      await db.query("insert into public.comments(post_id,body) values($1,'Eu estava lá')",[id]);
      await db.query('insert into public.post_likes(post_id) values($1)',[id]);
      await db.query('select public.set_post_repost($1,true)',[id]);
    });
    const snapshot=async()=>Promise.all(['posts','comments','post_likes','post_reposts','media_assets'].map(async table=>(await db.query(`select * from public.${table}`)).rows));
    const original=await snapshot();
    await db.exec(buildArenaCatalogSql());
    assert.equal((await feed(db,ALICE)).length,0,'reproduces the reported disappearance without deleting the row');
    assert.deepEqual(await snapshot(),original);
    await db.exec(migration);
    assert.deepEqual(await snapshot(),original,'no content, dates, IDs, audience or photo references are rewritten');
    for(const who of [ALICE,BOB]) {
      for(const args of [[],[0,null,null,ALICE],[0,null,null,null,id]]) {
        const post=(await feed(db,who,args)).find(p=>p.id===id);
        assert.ok(post); assert.equal(post.body,'Histórico real');assert.equal(post.arena_id,null);
        assert.equal(post.comment_count,1);assert.equal(post.like_count,1);
      }
      await asUser(db,who,async()=>{
        assert.equal((await db.query('select id from public.arenas where id=$1',[VILA])).rows.length,0);
        assert.equal((await db.query("select public.can_read_media('post-media',$1) visible",[path])).rows[0].visible,true);
        assert.equal((await db.query('select id from public.comments where post_id=$1',[id])).rows.length,1);
        assert.equal((await db.query('select * from public.read_feed()')).rows.length,1,'previous app reader remains compatible');
        await assert.rejects(db.query("select public.publish_post($1,'Novo relato',null,$2)",[randomUUID(),VILA]));
      });
    }
    assert.equal((await feed(db,BOB,[0,null,null,BOB]))[0].id,id);
    await db.exec(buildArenaCatalogSql());
    assert.deepEqual(await snapshot(),original,'repeated import does not affect original history');
    assert.equal((await feed(db,BOB)).length,1);
  } finally {await db.close();}
});

test('retired demo exception never bypasses private audiences, blocks, moderation, admission or real arena privacy', async () => {
  const db=await createTestDatabase();
  try {
    let group,publicPost,privatePost;
    await asUser(db,ALICE,async()=>{
      group=(await db.query('select public.create_community($1) r',[{name:'Histórico privado',description:'',rules:'',visibility:'private',entry_mode:'open',sports:[]}])).rows[0].r.id;
      publicPost=(await db.query("select public.publish_post($1,'Público',null,$2) id",[randomUUID(),VILA])).rows[0].id;
      privatePost=(await db.query("select public.publish_post($1,'Privado',null,$2,null,'private',null,$3) id",[randomUUID(),VILA,[group]])).rows[0].id;
    });
    await db.exec(buildArenaCatalogSql());
    assert.deepEqual((await feed(db,BOB)).map(p=>p.id),[publicPost]);
    await asUser(db,BOB,()=>db.query("select public.community_membership($1,'join')",[group]));
    assert.equal((await feed(db,BOB)).length,2);
    await asUser(db,BOB,()=>db.query("select public.community_membership($1,'leave')",[group]));
    assert.equal((await feed(db,BOB,[0,null,null,null,privatePost])).length,0);
    await asUser(db,ALICE,()=>db.query('insert into public.blocks(blocked_id) values($1)',[BOB]));
    assert.equal((await feed(db,BOB)).length,0);
    await asUser(db,ALICE,()=>db.query('delete from public.blocks where blocked_id=$1',[BOB]));
    await db.query('update public.posts set moderated_at=now() where id=$1',[publicPost]);
    assert.equal((await feed(db,BOB)).length,0);
    await db.query('update public.posts set moderated_at=null where id=$1',[publicPost]);
    await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1",[ALICE]);
    assert.equal((await feed(db,BOB)).length,0);
    await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1",[ALICE]);
    await db.query("update public.arenas set status='archived',is_demo=true where id=$1",[PRIVATE]);
    await db.query('update public.posts set arena_id=$1 where id=$2',[PRIVATE,publicPost]);
    assert.equal((await feed(db,BOB)).length,0,'unknown demo/private arena stays hidden');
    await db.query('update public.posts set arena_id=$1 where id=$2',[VILA,publicPost]);
    await db.query('update public.arenas set is_demo=false where id=$1',[VILA]);
    assert.equal((await feed(db,BOB)).length,0,'a real arena cannot use the exception');
    await asUser(db,null,()=>assert.rejects(db.query('select public.read_repost_feed()')));
  } finally {await db.close();}
});

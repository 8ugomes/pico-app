import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';
import { parseGameShare } from '../src/lib/supabase/game-sharing.ts';
const save = (db,id,date='2026-01-02',version=null) => db.query('select public.save_played_game($1,$2,$3,$4,$5) id',[id,VILA,FUTEVOLEI,date,version]);
const share = async(db,id,key,{version=1,body='',audience='beta',groups=[],wall=null}={}) => (await db.query('select public.share_played_game($1,$2,$3,$4,null,$5,$6,$7) id',[id,version,key,body,audience,wall,groups])).rows[0].id;

test('sharing is explicit, snapshots the game date, respects the canonical identity and never resurrects a deleted post', async()=>{
 const db=await createTestDatabase(); const id=randomUUID(),key=randomUUID();
 try { await asUser(db,ALICE,async()=>{
  await save(db,id);
  assert.equal((await db.query('select public.read_social_feed() r')).rows[0].r.length,0);
  const post=await share(db,id,key);
  assert.equal(await share(db,id,key),post);
  assert.equal((await db.query('select * from public.post_destinations where post_id=$1',[post])).rows.length,0);
  let feed=(await db.query('select public.read_social_feed(0,null,null,null,$1) r',[post])).rows[0].r;
  assert.equal(feed[0].game_played_on,'2026-01-02'); assert.notEqual(feed[0].created_at.slice(0,10),'2026-01-02');
  assert.match(feed[0].body,/02\/01\/2026/);
  await assert.rejects(share(db,id,key,{body:'Different'}),e=>e.code==='P0409');
  await save(db,id,'2026-01-03',1);
  assert.equal(await share(db,id,key),post); // Lost acknowledgment still identifies the old snapshot.
  await assert.rejects(share(db,id,randomUUID()),e=>e.code==='P0409');
  await db.query('select public.delete_played_game($1)',[id]);
  assert.equal(await share(db,id,key),post);
  assert.equal((await db.query('select played_on::text from public.post_game_context where post_id=$1',[post])).rows[0].played_on,'2026-01-02');
  await db.query('delete from public.posts where id=$1',[post]);
  await assert.rejects(share(db,id,key),e=>e.code==='P0409');
  assert.equal((await db.query('select * from public.post_game_context')).rows.length,0);
 }); } finally {await db.close()}
});

test('two users, private admission, blocks and revoked access apply to shared game metadata and context links', async()=>{
 const db=await createTestDatabase(); const id=randomUUID(); let group,post;
 try {
  await asUser(db,ALICE,async()=>{
   await save(db,id);
   group=(await db.query('select public.create_community($1) r',[{name:'Jogo privado',description:'',rules:'',entry_mode:'approval',visibility:'private',sports:[]}])).rows[0].r.id;
   post=await share(db,id,randomUUID(),{audience:'private',groups:[group]});
   await assert.rejects(share(db,id,randomUUID(),{audience:'private',groups:[group],wall:VILA}));
   await assert.rejects(db.query('insert into public.post_game_context(post_id,played_on) values($1,$2)',[randomUUID(),'2026-01-02']),e=>e.code==='42501');
   await assert.rejects(db.query('update public.post_game_context set played_on=$1 where post_id=$2',['2026-01-03',post]),e=>e.code==='42501');
  });
  await asUser(db,BOB,async()=>{
   await assert.rejects(share(db,id,randomUUID()),e=>e.code==='42501');
   assert.equal((await db.query('select * from public.post_game_context')).rows.length,0);
   await db.query("select public.community_membership($1,'join')",[group]);
   assert.equal((await db.query('select public.read_social_feed(0,null,null,null,$1) r',[post])).rows[0].r.length,0); // pending
  });
  await asUser(db,ALICE,()=>db.query("select public.community_membership($1,'approve',$2)",[group,BOB]));
  await asUser(db,BOB,async()=>{
   const rows=(await db.query('select public.read_social_feed(0,null,null,null,$1) r',[post])).rows[0].r;
   assert.equal(rows[0].game_played_on,'2026-01-02'); assert.equal(rows[0].destinations[0].community_name,'Jogo privado');
   assert.ok(rows[0].destinations[0].community_slug);
   await db.query('insert into public.blocks(blocked_id) values($1)',[ALICE]);
   assert.equal((await db.query('select * from public.post_game_context')).rows.length,0);
  });
  await db.query("update pico_private.beta_admissions set status='revoked' where player_id=$1",[ALICE]);
  await asUser(db,ALICE,()=>assert.rejects(share(db,id,randomUUID()),e=>e.code==='42501'));
  await asUser(db,null,()=>assert.rejects(db.query('select * from public.post_game_context'),e=>e.code==='42501'));
 } finally {await db.close()}
});

test('legacy rows stay private and are read without live state or conversion', async()=>{
 const db=await createTestDatabase();
 try {
  await db.query("insert into public.checkins(player_id,arena_id,sport_id,started_at,expires_at) values($1,$3,$4,'2026-01-02T21:00:00Z','2026-01-02T22:00:00Z'),($2,$3,$4,'2026-01-03T21:00:00Z','2026-01-03T22:00:00Z')",[ALICE,BOB,VILA,FUTEVOLEI]);
  for (const [who,day] of [[ALICE,'2026-01-02'],[BOB,'2026-01-03']]) await asUser(db,who,async()=>{
   const rows=(await db.query('select public.read_retired_checkins() r')).rows[0].r;
   assert.equal(rows.length,1);assert.equal(rows[0].recorded_on,day);
   assert.deepEqual(Object.keys(rows[0]).sort(),['arena_name','arena_slug','id','recorded_on','sport_name']);
   assert.equal((await db.query('select public.read_played_games() r')).rows[0].r.length,0);
   assert.equal((await db.query('select public.read_social_feed() r')).rows[0].r.length,0);
   await assert.rejects(db.query('select * from public.checkins'),e=>e.code==='42501');
   await assert.rejects(db.query('select public.activity_summary($1)',[who]),e=>e.code==='42501');
  });
  await asUser(db,null,()=>assert.rejects(db.query('select public.read_retired_checkins()'),e=>e.code==='42501'));
 } finally {await db.close()}
});

test('sharing rejects forged author/date, missing version and excessive destination lists',()=>{
 const input={id:randomUUID(),key:randomUUID(),version:1,body:'',audience:'beta',groups:[]};
 assert.equal(parseGameShare(input).body,'');
 for(const change of [{playerId:BOB},{playedOn:'2026-01-01'},{version:0},{version:undefined},{groups:Array(6).fill(randomUUID())},{audience:'public'}]) assert.throws(()=>parseGameShare({...input,...change}));
});

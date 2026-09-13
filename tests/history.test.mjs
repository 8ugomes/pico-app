import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI, BEACH, PRIVATE } from './helpers/database.mjs';
import { gameToday, validGameDate, formatGameDate } from '../src/lib/game-date.ts';
import { parseGameMutation, gameOffset } from '../src/lib/supabase/games.ts';
const id='60000000-0000-4000-8000-000000000001';
const save=(db,game=id,arena=VILA,sport=FUTEVOLEI,date='2026-01-01',version=null)=>db.query('select save_played_game($1,$2,$3,$4,$5)',[game,arena,sport,date,version]);
test('game date, owner and pagination inputs reject forged or future values',()=>{
 const input={action:'save',id,arenaId:VILA,sportId:FUTEVOLEI,playedOn:'2026-01-01'};
 assert.equal(parseGameMutation(input).playedOn,input.playedOn);
 for(const extra of [{playerId:BOB},{createdAt:'2026-01-01'}, {playedOn:'2099-01-01'},{playedOn:'2026-02-30'},{version:0},{version:1.5},{audience:'beta'}]) assert.throws(()=>parseGameMutation({...input,...extra}));
 for(const q of ['player='+BOB,'offset=-1','offset=10001','offset=0.5']) assert.throws(()=>gameOffset(new URLSearchParams(q)));
 assert.equal(gameToday(new Date('2026-01-02T01:00:00Z')),'2026-01-01');
 assert.equal(validGameDate('2024-02-29','2024-03-01'),true);
 assert.match(formatGameDate('2026-01-01'),/1 de janeiro de 2026/);
});
test('private game CRUD enforces author, date, retries and version; produces no posts or activity exposure',async()=>{
 const db=await createTestDatabase();try{
  await asUser(db,null,()=>assert.rejects(save(db),e=>e.code==='42501'));
  await asUser(db,ALICE,async()=>{
   for(const args of [[id,PRIVATE,FUTEVOLEI],[id,VILA,BEACH],[id,VILA,FUTEVOLEI,'2099-01-01'],[id,VILA,FUTEVOLEI,'infinity'],[id,VILA,FUTEVOLEI,null]]) await assert.rejects(save(db,...args));
   await save(db);await save(db);
   assert.equal((await db.query('select read_played_games() r')).rows[0].r.length,1);
   assert.equal((await db.query('select count(*)::int n from posts')).rows[0].n,0);
   await assert.rejects(db.query('insert into played_games(id,player_id,arena_id,sport_id,played_on) values(gen_random_uuid(),$1,$2,$3,current_date)',[BOB,VILA,FUTEVOLEI]),e=>e.code==='42501');
   await save(db,id,VILA,FUTEVOLEI,'2026-01-02',1);await save(db,id,VILA,FUTEVOLEI,'2026-01-02',1);
   await assert.rejects(save(db,id,VILA,FUTEVOLEI,'2026-01-03',1),e=>e.code==='P0409');
  });
  await asUser(db,BOB,async()=>{
   assert.deepEqual((await db.query('select read_played_games() r')).rows[0].r,[]);
   assert.equal((await db.query('select * from played_games')).rows.length,0);
   await assert.rejects(save(db,id),e=>e.code==='42501');
   await db.query('select delete_played_game($1)',[id]);
  });
  assert.equal((await db.query('select * from played_games')).rows.length,1);
  await db.query("update pico_private.beta_admissions set status='revoked' where player_id=$1",[ALICE]);
  await asUser(db,ALICE,async()=>{
   assert.equal((await db.query('select * from played_games')).rows.length,0);
   for(const sql of ['select read_played_games()','select delete_played_game($1)']) await assert.rejects(db.query(sql,sql.includes('$1')?[id]:[]),e=>e.code==='42501');
   await assert.rejects(save(db),e=>e.code==='42501');
  });
  await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1",[ALICE]);
  await asUser(db,ALICE,async()=>{await db.query('select delete_played_game($1)',[id]);await db.query('select delete_played_game($1)',[id]);assert.deepEqual((await db.query('select read_played_games() r')).rows[0].r,[]);await assert.rejects(save(db),e=>e.code==='P0409');await save(db,'60000000-0000-4000-8000-000000000002');await assert.rejects(db.query('select * from pico_private.deleted_game_keys'),e=>e.code==='42501');});
  await db.query('delete from auth.users where id=$1',[ALICE]);
  assert.equal((await db.query('select * from played_games')).rows.length,0);
  assert.equal((await db.query('select * from pico_private.deleted_game_keys')).rows.length,0);
 }finally{await db.close();}
});
test('journal pagination is private and date correction survives archived original arena',async()=>{
 const db=await createTestDatabase();try{
  await asUser(db,ALICE,async()=>{
   for(let i=1;i<=22;i++)await save(db,`60000000-0000-4000-8000-${String(i).padStart(12,'0')}`,VILA,FUTEVOLEI,`2026-01-${String(i).padStart(2,'0')}`);
   const first=(await db.query('select read_played_games() r')).rows[0].r;
   const next=(await db.query('select read_played_games(20) r')).rows[0].r;
   assert.equal(first.length,21);assert.equal(next.length,2);assert.equal(first[0].played_on,'2026-01-22');assert.equal(new Set([...first.slice(0,20),...next].map(g=>g.id)).size,22);
   await assert.rejects(db.query('select read_played_games(-1)'));
  });
  await db.query("update arenas set status='archived' where id=$1",[VILA]);
  await asUser(db,ALICE,async()=>{await save(db,id,VILA,FUTEVOLEI,'2026-02-01',1);await assert.rejects(save(db,'60000000-0000-4000-8000-000000000099'));await db.query('select delete_played_game($1)',[id]);});
  await asUser(db,BOB,async()=>assert.deepEqual((await db.query('select read_played_games() r')).rows[0].r,[]));
 }finally{await db.close();}
});

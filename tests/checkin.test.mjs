import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';
import { parseMutation } from '../src/lib/supabase/mutations.ts';
import { parseReadRequest } from '../src/lib/supabase/read-service.ts';
test('retired presence rejects APIs and active filters', () => {
 for (const action of ['start_checkin','end_checkin']) assert.throws(()=>parseMutation({action,arenaId:VILA,sportId:FUTEVOLEI}));
 assert.throws(()=>parseReadRequest(new URLSearchParams({resource:'checkin'})));
 for(const active of ['true','false']) assert.throws(()=>parseReadRequest(new URLSearchParams({resource:'discover',active})));
});
test('upgrade preserves old rows without publishing or converting them; all client presence surfaces are closed', async () => {
 const db=await createTestDatabase({through:'20260910100000_operator_measures.sql'});
 try {
  await asUser(db,ALICE,async()=>{await db.query('select start_checkin($1,$2)',[VILA,FUTEVOLEI]);await db.query('update profiles set share_activity_summary=true where id=$1',[ALICE]);});
  const before=(await db.query('select * from checkins')).rows;
  await db.exec(await readFile('supabase/migrations/20260912090000_played_games.sql','utf8'));
  assert.deepEqual((await db.query('select * from checkins')).rows,before);
  assert.equal((await db.query('select count(*)::int n from played_games')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from posts')).rows[0].n,0);
  for(const id of [null,ALICE,BOB]) await asUser(db,id,async()=>{
   for(const [sql,args] of [['select * from checkins',[]],['select start_checkin($1,$2)',[VILA,FUTEVOLEI]],['select end_checkin()',[]],['select read_checkin_history()',[]],['select activity_summary($1)',[ALICE]]]) await assert.rejects(db.query(sql,args),e=>e.code==='42501');
  });
 } finally {await db.close();}
});

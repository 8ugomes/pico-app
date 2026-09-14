import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, BEACH, FUTEVOLEI } from './helpers/database.mjs';
import { parseReadRequest } from '../src/lib/supabase/read-service.ts';

test('arena search validates text, sport identity and pagination at the HTTP boundary', () => {
  assert.deepEqual(parseReadRequest(new URLSearchParams({resource:'arenas',search:'  São Carlos  ',sportId:BEACH,offset:'24'})),{resource:'arenas',search:'São Carlos',sportId:BEACH,offset:24});
  for(const query of [{search:'x'.repeat(101)},{sportId:'no-uuid'},{offset:'10001'}]) assert.throws(()=>parseReadRequest(new URLSearchParams({resource:'arenas',...query})),e=>e.code==='invalid_request');
});

test('directory search filters before pagination, matches literal accents and preserves account and arena access', async () => {
 const db=await createTestDatabase();
 try {
  const ids=[];
  for(let n=0;n<30;n++) {
   const id=randomUUID();ids.push(id);
   await db.query("insert into public.arenas(id,slug,name,city,neighborhood,public_info,is_public) values($1,$2,$3,$4,'Bairro São Luís','Rua das Flores, 80',true)", [id,'fixture-'+n,`ZZ Arena ${String(n).padStart(2,'0')}`,n===29?'Ribeirão Preto':'Campinas']);
   await db.query('insert into public.arena_sports(arena_id,sport_id) values($1,$2)',[id,n===29?FUTEVOLEI:BEACH]);
  }
  await db.query("update public.arenas set name='100%_Literal' where id=$1",[ids[28]]);
  await asUser(db,BOB,async()=>{
   const find=(q='',off=0,sport=null)=>db.query('select id,name from public.search_arenas($1,$2,$3)',[q,off,sport]);
   assert.equal((await find('ribeirao')).rows[0].id,ids[29]);
   assert.equal((await find('RIBEIRÃO')).rows.length,1);
   assert.equal((await find('Ribeirao',0,BEACH)).rows.length,0);
   assert.equal((await find('Ribeirao',0,FUTEVOLEI)).rows.length,1);
   assert.equal((await find('%_')).rows.length,1);
   assert.equal((await find("x') or true --")).rows.length,0);
   assert.equal((await find('Rua das Flores')).rows.length,25);
   const first=(await find('Sao Luis')).rows.slice(0,24),second=(await find('Sao Luis',24)).rows;
   assert.equal(first.length,24);assert.equal(second.length,6);
   assert.equal(new Set([...first,...second].map(r=>r.id)).size,30);
   assert.equal((await find('arena-privada-teste')).rows.length,0);
   await assert.rejects(find('x'.repeat(101)));
   await assert.rejects(find('',10001));
  });
  await db.query("update public.arenas set status='archived',is_public=false where id=$1",[ids[29]]);
  await asUser(db,BOB,async()=>assert.equal((await db.query("select id from public.search_arenas('ribeirao')")).rows.length,0));
  await asUser(db,null,()=>assert.rejects(db.query('select id from public.search_arenas()')));
  await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1",[ALICE]);
  await asUser(db,ALICE,()=>assert.rejects(db.query('select id from public.search_arenas()')));
 } finally {await db.close();}
});

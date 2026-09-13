import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTestDatabase,asUser,ALICE,BOB,VILA,FUTEVOLEI} from './helpers/database.mjs';
import {contentSecurityPolicy} from '../src/lib/security-headers.ts';

test('account export is service-only, isolates the subject and never returns credentials or other authors',async()=>{
 const db=await createTestDatabase();try{
  for(const uid of [ALICE,BOB])await asUser(db,uid,async()=>{await db.query('select public.set_arena_membership($1,true)',[VILA]);await db.query('insert into posts(arena_id,sport_id,body) values($1,$2,$3)',[VILA,FUTEVOLEI,uid===ALICE?'Own private text':'Other author text']);await db.query("select save_played_game(gen_random_uuid(),$1,$2,'2026-01-01')",[VILA,FUTEVOLEI]);});
  await db.query("insert into pico_private.invitations(kind,email,token_hash,expires_at) values('beta','alice@example.invalid','sensitive-invite-token',now()+interval '1 day')");
  for(const uid of [null,ALICE,BOB])await asUser(db,uid,()=>assert.rejects(db.query('select public.export_account_data($1)',[ALICE]),e=>e.code==='42501'));
  // Rights still work when social admission is suspended.
  await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1",[ALICE]);
  await db.exec('set role service_role');
  const data=(await db.query('select public.export_account_data($1) data',[ALICE])).rows[0].data;
  assert.equal(data.profile[0].id,ALICE);assert.equal(data.games.length,1);assert.equal(data.posts.length,1);assert.equal(data.posts[0].body,'Own private text');
  assert.ok(!JSON.stringify(data).includes('Other author text'));assert.ok(!JSON.stringify(data).includes('sensitive-invite-token'));
  assert.ok(!/(password|token_hash|request_digest|raw_user_meta_data)/.test(JSON.stringify(data)));
  await db.query('select public.export_account_data($1)',[ALICE]);await db.query('select public.export_account_data($1)',[ALICE]);
  await assert.rejects(db.query('select public.export_account_data($1)',[ALICE]),e=>e.code==='P0429');
  await db.exec('reset role');
 }finally{await db.close();}
});

test('deletion erases own private invitation data, preserves others and refuses the last operator before marking',async()=>{
 const db=await createTestDatabase();try{
  await db.query("insert into pico_private.platform_grants(player_id,role) values($1,'admin')",[ALICE]);
  await assert.rejects(db.query('insert into account_deletions(player_id) values($1)',[ALICE]),e=>e.code==='P0409');
  assert.equal((await db.query('select * from account_deletions')).rows.length,0);
  await db.query("insert into pico_private.platform_grants(player_id,role) values($1,'admin')",[BOB]);
  await db.query('insert into account_deletions(player_id) values($1)',[ALICE]);
  await assert.rejects(db.query('insert into account_deletions(player_id) values($1)',[BOB]),e=>e.code==='P0409');
  await db.query("insert into pico_private.invitations(kind,email,token_hash,expires_at) values('beta','alice@example.invalid','token-a',now()+interval '1 day'),('beta','bob@example.invalid','token-b',now()+interval '1 day')");
  for(const uid of [null,ALICE,BOB])await asUser(db,uid,()=>assert.rejects(db.query('select public.erase_account_private_data($1)',[ALICE]),e=>e.code==='42501'));
  await db.exec('set role service_role');await assert.rejects(db.query('select public.erase_account_private_data($1)',[BOB]),e=>e.code==='42501');await db.query('select public.erase_account_private_data($1)',[ALICE]);await db.exec('reset role');
  assert.deepEqual((await db.query('select email from pico_private.invitations')).rows.map(r=>r.email),['bob@example.invalid']);
 }finally{await db.close();}
});

test('production policy restricts scripts, connections, framing and browser sensors without allowing JS eval',()=>{
 const policy=contentSecurityPolicy('test-random-nonce','https://project.supabase.co');
 assert.ok(policy.includes("'nonce-test-random-nonce'"));assert.ok(policy.includes("'strict-dynamic'"));assert.ok(!policy.includes("'unsafe-eval'"));
 assert.match(policy,/connect-src 'self' blob: https:\/\/project.supabase.co;/);assert.ok(policy.includes("frame-ancestors 'none'"));
 assert.ok(!policy.split(';').find(p=>p.trim().startsWith('script-src')).includes('unsafe-inline'));
});

test('oversized account archives fail explicitly instead of silently omitting records',async()=>{
 const db=await createTestDatabase();try{
  const post=(await db.query("insert into posts(author_id,body) values($1,'Controlled archive test') returning id",[ALICE])).rows[0].id;
  await db.query("insert into comments(author_id,post_id,body) select $1,$2,'Comment '||n from generate_series(1,5001)n",[ALICE,post]);
  await db.exec('set role service_role');
  await assert.rejects(db.query('select public.export_account_data($1)',[ALICE]),e=>e.code==='P0413');
  await db.exec('reset role');
 }finally{await db.close();}
});

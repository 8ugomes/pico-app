import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, asUser, ALICE, BOB, FUTEVOLEI, BEACH } from './helpers/database.mjs';
const save = (db, sport = FUTEVOLEI) => db.query("select public.save_profile('Jogador teste','jogador_teste','','','',$1,'Iniciante',false)", [sport]);

test('official enrollment follows complete profile, is atomic, idempotent and respects departure', async () => {
 const db = await createTestDatabase();
 try {
  const id = (await db.query('select community_id from pico_private.pico_community')).rows[0].community_id;
  await asUser(db, ALICE, async () => {
   await db.query('select public.ensure_pico_membership()');
   assert.equal((await db.query('select public.pico_welcome() w')).rows[0].w, null);
   await assert.rejects(save(db, 'ffffffff-ffff-4fff-8fff-ffffffffffff'));
   assert.equal((await db.query('select onboarding_completed from public.profiles where id=$1', [ALICE])).rows[0].onboarding_completed, false);
   await save(db);
   await db.query('select public.ensure_pico_membership()');
   const welcome = (await db.query('select public.pico_welcome() w')).rows[0].w;
   assert.equal(welcome.pending, true); assert.equal(welcome.id, id);
   assert.equal((await db.query('select public.pico_welcome(true) w')).rows[0].w.pending, false);
   await save(db, BEACH);
   assert.equal((await db.query('select public.pico_welcome() w')).rows[0].w.pending, false);
   const page = (await db.query("select public.community_page('pico-oficial') p")).rows[0].p;
   assert.equal(page.pico_official, true); assert.equal(page.editorial.length, 3); assert.equal(page.owner, null);
   await db.query("select public.community_membership($1,'leave')", [id]);
   await save(db); await db.query('select public.ensure_pico_membership()');
   assert.equal((await db.query('select public.pico_welcome() w')).rows[0].w, null);
   assert.equal((await db.query('select status from public.community_members where community_id=$1 and player_id=$2', [id,ALICE])).rows[0].status, 'removed');
  });
  assert.equal((await db.query('select count(*)::int n from pico_private.pico_welcomes')).rows[0].n,1);
  await asUser(db, BOB, async () => {
   assert.equal((await db.query('select public.pico_welcome(true) w')).rows[0].w,null);
   await assert.rejects(db.query('select * from pico_private.pico_welcomes'));
   await assert.rejects(db.query('select * from pico_private.pico_editorial'));
   await assert.rejects(db.query("update public.communities set name='Outro nome' where id=$1", [id]));
  });
  await db.query('select public.bootstrap_operator($1)',[BOB]);
  await asUser(db, BOB, async () => {
   await assert.rejects(db.query("select public.operator_resource_action('community',$1,'archive')", [id]));
   await assert.rejects(db.query("select public.community_membership($1,'transfer',$2)",[id,ALICE]));
  });
  await asUser(db,null,async()=>{await assert.rejects(db.query('select public.ensure_pico_membership()'));await assert.rejects(db.query('select public.pico_welcome()'));});
 } finally { await db.close(); }
});

test('signup is open but confirmation, bans and scoped invitations still guard data', async () => {
 const db=await createTestDatabase();
 try {
  assert.deepEqual((await db.query('select public.beta_before_user_created($1) r',[{user:{email:'new@example.invalid'}}])).rows[0].r,{});
  const newcomer='30000000-0000-4000-8000-000000000009';
  await db.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'new@example.invalid',null,'{\"role\":\"admin\",\"onboarding_completed\":true}')",[newcomer]);
  await asUser(db,newcomer,async()=>{assert.equal((await db.query('select public.beta_status() s')).rows[0].s.admitted,false);assert.equal((await db.query('select * from public.profiles')).rows.length,0);});
  await db.query('update auth.users set email_confirmed_at=now() where id=$1',[newcomer]);
  await asUser(db,newcomer,async()=>{const s=(await db.query('select public.beta_status() s')).rows[0].s;assert.equal(s.admitted,true);assert.equal(s.role,null);});
  await db.query("update pico_private.beta_admissions set status='suspended' where player_id=$1",[newcomer]);
  await asUser(db,newcomer,async()=>{await assert.rejects(db.query('select public.ensure_pico_membership()'));assert.equal((await db.query('select public.beta_status() s')).rows[0].s.admitted,false);});
 } finally {await db.close();}
});

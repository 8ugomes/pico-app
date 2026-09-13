import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { parseMutation, mutateSocial } from '../src/lib/supabase/mutations.ts';
import { createTestDatabase, asUser, ALICE, BOB, VILA, FUTEVOLEI } from './helpers/database.mjs';
import { createDemoState, demoReducer } from '../src/lib/demo-state.ts';
import { mock } from '../src/data/mock.ts';

test('comment edit accepts only trimmed bounded text and an ID', () => {
  const value = { action: 'edit_comment', id: ALICE, body: '  Texto revisado  ' };
  assert.deepEqual(parseMutation(value), { ...value, body: 'Texto revisado' });
  for (const bad of [{ ...value, body: ' ' }, { ...value, body: 'x'.repeat(281) }, { ...value, id: 'bad' }, { ...value, authorId: BOB }, { ...value, postId: BOB }]) assert.throws(() => parseMutation(bad), e => e.status === 400);
});

test('comment mutation uses verified author and does not report success for inaccessible rows', async () => {
  const requests = [];
  let rows = [{id:BOB}];
  const client = createClient('https://transport-fixture.supabase.co', 'sb_publishable_fixture_only', {
    auth: {persistSession:false,autoRefreshToken:false},
    global: {fetch: async (url, init) => { requests.push({url:new URL(String(url)),method:init.method,body:JSON.parse(init.body)});return Response.json(rows); }},
  });
  client.auth.getUser = async () => ({data:{user:{id:ALICE}},error:null});
  await mutateSocial(client,{action:'edit_comment',id:BOB,body:'Revisado'});
  assert.equal(requests[0].method,'PATCH');
  assert.equal(requests[0].url.searchParams.get('author_id'),'eq.'+ALICE);
  assert.equal(requests[0].url.searchParams.get('id'),'eq.'+BOB);
  assert.deepEqual(requests[0].body,{body:'Revisado'});
  rows=[];
  await assert.rejects(mutateSocial(client,{action:'edit_comment',id:BOB,body:'Revisado'}),e=>e.status===404);
  client.auth.getUser = async () => ({data:{user:null},error:{name:'AuthSessionMissingError'}});
  const count=requests.length;
  await assert.rejects(mutateSocial(client,{action:'edit_comment',id:BOB,body:'Revisado'}),e=>e.status===401);
  assert.equal(requests.length,count);
});

test('comment edits preserve identity and remain subject to RLS, blocks and moderation', async () => {
  const db=await createTestDatabase();
  try {
    await asUser(db,ALICE,()=>db.query('select public.set_arena_membership($1,true)',[VILA]));
    const post=await asUser(db,ALICE,async()=>(await db.query('insert into public.posts(arena_id,sport_id,body) values($1,$2,$3) returning id',[VILA,FUTEVOLEI,'Relato de teste'])).rows[0].id);
    const original=await asUser(db,BOB,async()=>(await db.query('insert into public.comments(post_id,body) values($1,$2) returning *',[post,'Primeira versão'])).rows[0]);
    await asUser(db,BOB,async()=>{
      const edited=(await db.query('update public.comments set body=$1 where id=$2 returning *',['Versão revisada',original.id])).rows[0];
      assert.equal(edited.author_id,BOB);assert.equal(edited.post_id,post);assert.deepEqual(edited.created_at,original.created_at);
      await assert.rejects(db.query('update public.comments set author_id=$1 where id=$2',[ALICE,original.id]));
      await assert.rejects(db.query('update public.comments set body=$1 where id=$2',['x'.repeat(281),original.id]));
    });
    await asUser(db,ALICE,async()=>{
      assert.equal((await db.query('update public.comments set body=$1 where id=$2 returning id',['Alheio',original.id])).rows.length,0);
      assert.equal((await db.query('delete from public.comments where id=$1 returning id',[original.id])).rows.length,0);
      await db.query('insert into public.blocks(blocked_id) values($1)',[BOB]);
    });
    await asUser(db,BOB,async()=>assert.equal((await db.query('update public.comments set body=$1 where id=$2 returning id',['Bloqueado',original.id])).rows.length,0));
    await asUser(db,ALICE,()=>db.query('delete from public.blocks where blocked_id=$1',[BOB]));
    await db.query('update public.comments set moderated_at=now() where id=$1',[original.id]);
    await asUser(db,BOB,async()=>assert.equal((await db.query('update public.comments set body=$1 where id=$2 returning id',['Moderado',original.id])).rows.length,0));
    await asUser(db,null,()=>assert.rejects(db.query('update public.comments set body=$1 where id=$2',['Anônimo',original.id])));
  } finally {await db.close();}
});

test('demo edit/delete only affects own local content and removes dependent references', () => {
  let state=createDemoState(mock);
  const other=state.posts.find(p=>p.authorId!==state.currentUserId);
  for(const type of ['edit_content','delete_content']) assert.equal(demoReducer(state,{type,target:'post',id:other.id,content:'Alheio'}),state);
  state=demoReducer(state,{type:'post',id:'own',now:1,input:{arenaId:'vila',sportId:'futevolei',content:'Meu relato'}});
  state=demoReducer(state,{type:'comment',id:'own-comment',postId:'own',content:'Minha resposta',now:2});
  state=demoReducer(state,{type:'edit_content',target:'comment',id:'own-comment',content:' Revisado '});
  assert.equal(state.comments.find(c=>c.id==='own-comment').content,'Revisado');
  assert.equal(demoReducer(state,{type:'edit_content',target:'comment',id:'own-comment',content:'x'.repeat(281)}),state);
  state=demoReducer(state,{type:'like',postId:'own'});
  state=demoReducer(state,{type:'delete_content',target:'post',id:'own'});
  assert.ok(!state.posts.some(p=>p.id==='own')&&!state.comments.some(c=>c.postId==='own')&&!state.likedPostIds.includes('own'));
  assert.equal(createDemoState(mock).posts.length,mock.posts.length);
});

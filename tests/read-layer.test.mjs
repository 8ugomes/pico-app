import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseEnvironment } from '../src/lib/supabase/config.ts';
import { parseReadRequest, readSocial, safeArenaImage } from '../src/lib/supabase/read-service.ts';
import { listPublicArenas, ARENA_PAGE_SIZE } from '../src/lib/supabase/queries.ts';

const sport = {id:'10000000-0000-4000-8000-000000000001',slug:'futevolei',name:'Futevôlei'};
const uid = '30000000-0000-4000-8000-000000000001';
const arena = {id:'20000000-0000-4000-8000-000000000001',slug:'arena-de-teste',name:'Arena de teste',description:'Fixture de transporte, não Supabase hospedado.',neighborhood:'Teste',city:'São Paulo',image_path:'/images/urban-court.webp',is_demo:true,arena_sports:[{sports:sport}]};
const profile = {id:uid,username:'alice_teste',display_name:'Alice de teste',bio:'Bio',city:'São Paulo',neighborhood:'Teste',available:false,is_demo:false,onboarding_completed:false,player_sports:[{level:'Iniciante',is_primary:true,sports:sport}], email:'not-for-public@example.invalid',role:'not-for-public'};
function clientWith({tableData={}, auth='verified', failTable, networkError=false}={}) {
  const requests=[];
  const client = createClient('https://transport-fixture.supabase.co', 'sb_publishable_fixture_only', {
    db: {retry:false},
    auth: {persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global: {fetch: async (input,init) => {
      const url = new URL(String(input)); requests.push({url,headers:new Headers(init?.headers)});
      if(networkError) throw new Error('Internal credential must not reach UI');
      const table = url.pathname.split('/').at(-1);
      if(table===failTable) return Response.json({message:'Internal SQL/credential detail',code:'42P01'},{status:400});
      const value = tableData[table] ?? (table==='sports'?[sport]:table==='profiles'?[profile]:[arena]);
      // maybeSingle in the SDK expects an array response; the SDK validates cardinality.
      return Response.json(value);
    }},
  });
  // Controlled identity response for query-contract tests; not proof of JWT verification.
  client.auth.getUser = async () => auth === 'verified' ? {data:{user:{id:uid,email:profile.email}},error:null}
    : auth === 'missing' ? {data:{user:null},error:{name:'AuthSessionMissingError'}}
    : auth === 'expired' ? {data:{user:null},error:{status:401}}
    : {data:{user:null},error:{name:'AuthRetryableFetchError',status:503}};
  return {client,requests};
}

test('only missing configuration selects demo; incomplete, unsafe and secret configuration is invalid', () => {
  assert.deepEqual(resolveSupabaseEnvironment(),{status:'demo'});
  assert.deepEqual(resolveSupabaseEnvironment('  ','  '),{status:'demo'});
  for(const [url,key] of [['https://example.supabase.co',undefined],[undefined,'key'],['nonsense','key'],['http://remote.invalid','key'],['https://name:password@example.com','key'],['https://example.com?token=hidden','key'],['https://example.com','sb_secret_not_allowed']]) assert.equal(resolveSupabaseEnvironment(url,key).status,'invalid');
  const jwtRole = role => `e30.${Buffer.from(JSON.stringify({role})).toString('base64url')}.fixture`;
  assert.equal(resolveSupabaseEnvironment('https://example.supabase.co',jwtRole('service_role')).status,'invalid');
  assert.equal(resolveSupabaseEnvironment('https://example.supabase.co',jwtRole('anon')).status,'configured');
  assert.equal(resolveSupabaseEnvironment('http://127.0.0.1:54321','sb_publishable_fixture').status,'configured');
});

test('request parsing validates slugs/pages and has no client-supplied profile identity', () => {
  assert.deepEqual(parseReadRequest(new URLSearchParams('resource=profile&player_id=someone-else')),{resource:'profile'});
  assert.deepEqual(parseReadRequest(new URLSearchParams('resource=arenas&offset=24')),{resource:'arenas',offset:24});
  for(const value of ['resource=unknown','resource=arena&slug=../secret','resource=arenas&offset=-1','resource=arenas&offset=1.5','resource=arenas&offset=10001']) assert.throws(()=>parseReadRequest(new URLSearchParams(value)),e=>e.code==='invalid_request');
});

test('arena list uses public filter, stable pagination, sports join and carries demo labels', async () => {
  const {client,requests}=clientWith();
  const data=await readSocial(client,{resource:'arenas',offset:24});
  assert.equal(data.kind,'arenas'); assert.equal(data.arenas[0].isDemo,true);
  assert.deepEqual(data.arenas[0].sports,[sport]);
  const query=requests.find(r=>r.url.pathname.endsWith('/arenas')).url.searchParams;
  assert.equal(query.get('is_public'),'eq.true');
  assert.equal(query.get('order'),'name.asc,id.asc');
  assert.equal(query.get('offset'),'24'); assert.equal(Number(query.get('limit')),ARENA_PAGE_SIZE+1);
  assert.match(query.get('select'),/arena_sports\(enabled,sports\(id,slug,name\)\)/);
  assert.equal(data.offset,24); assert.equal(data.hasMore,false);
  assert.throws(()=>listPublicArenas(client,-1), e=>e.code==='invalid_request');
});

test('pagination has a lookahead row without dropping items and empty data stays empty', async () => {
  const records=Array.from({length:25},(_,i)=>({...arena,id:String(i)}));
  const full=await readSocial(clientWith({tableData:{arenas:records}}).client,{resource:'arenas',offset:0});
  assert.equal(full.arenas.length,24); assert.equal(full.hasMore,true);
  const empty=await readSocial(clientWith({tableData:{arenas:[],sports:[]}}).client,{resource:'arenas',offset:0});
  assert.deepEqual(empty.arenas,[]); assert.deepEqual(empty.sports,[]); assert.equal(empty.hasMore,false);
});

test('arena detail accepts non-mock slugs, keeps exact slug/public filters and returns not found', async () => {
  const {client,requests}=clientWith();
  const data=await readSocial(client,{resource:'arena',slug:'arena-de-teste'});
  assert.equal(data.arena.slug,'arena-de-teste');
  assert.equal(requests[0].url.searchParams.get('slug'),'eq.arena-de-teste');
  assert.equal(requests[0].url.searchParams.get('is_public'),'eq.true');
  await assert.rejects(readSocial(clientWith({tableData:{arenas:[]}}).client,{resource:'arena',slug:'inexistente'}),e=>e.code==='not_found');
});

test('own profile query uses verified identity and DTO excludes email, role and private paths', async () => {
  const {client,requests}=clientWith();
  const result=await readSocial(client,{resource:'profile'});
  assert.equal(result.profile.id,uid); assert.equal(result.profile.name,'Alice de teste');
  assert.deepEqual(result.profile.sports,[{sport,level:'Iniciante',isPrimary:true}]);
  assert.equal(requests[0].url.searchParams.get('id'),`eq.${uid}`);
  assert.ok(!requests[0].url.searchParams.get('select').includes('email'));
  assert.ok(!('email' in result.profile) && !('role' in result.profile) && !('avatar_path' in result.profile));
  await assert.rejects(readSocial(clientWith({tableData:{profiles:[]}}).client,{resource:'profile'}),e=>e.code==='profile_missing');
});

test('no profile query runs for absent/expired identity, while Auth outages remain errors', async () => {
  for(const auth of ['missing','expired','unavailable']) {
    const {client,requests}=clientWith({auth});
    await assert.rejects(readSocial(client,{resource:'profile'}),e=>e.code===(auth==='unavailable'?'unavailable':'authentication'));
    assert.equal(requests.length,0);
  }
});

test('query failures never become demo, empty state or raw error details', async () => {
  for(const failTable of ['arenas','sports']) await assert.rejects(readSocial(clientWith({failTable}).client,{resource:'arenas',offset:0}), e=>e.code==='unavailable' && !e.message.includes('SQL'));
  await assert.rejects(readSocial(clientWith({failTable:'profiles'}).client,{resource:'profile'}), e=>e.code==='unavailable');
  await assert.rejects(readSocial(clientWith({networkError:true}).client,{resource:'arena',slug:'teste'}),e=>e.code==='unavailable');
});

test('arena images cannot pretend bundled demo artwork is a real venue or fetch arbitrary paths', () => {
  assert.equal(safeArenaImage('/images/urban-court.webp',true),'/images/urban-court.webp');
  for(const path of ['/images/urban-court.webp','https://external.invalid/pixel','//external.invalid/pixel','/api/private','javascript:alert(1)',null]) assert.equal(safeArenaImage(path,false),null);
  assert.equal(safeArenaImage('https://external.invalid/pixel',true),null);
});

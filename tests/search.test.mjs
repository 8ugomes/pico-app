import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDatabase, asUser, ALICE, BOB, FUTEVOLEI, BEACH, VILA } from './helpers/database.mjs';
import { parseReadRequest } from '../src/lib/supabase/read-service.ts';
import { parseCommunitySearch } from '../src/lib/supabase/community-search.ts';
let db;
before(async () => {
  db = await createTestDatabase();
  for (const [id, name, username] of [[ALICE, 'Alice', 'alice'], [BOB, 'João Açúcar', 'joao_areia']]) {
    await asUser(db, id, () => db.query(`select save_profile($1,$2,'','São Paulo','Pinheiros',$3,'Intermediário',false)`, [name, username, FUTEVOLEI]));
  }
});
after(async () => { await db?.close(); });
test('search parser trims, bounds text, and preserves literal input and filters', () => {
  const read = value => parseReadRequest(new URLSearchParams({ resource: 'discover', search: value }));
  assert.equal(read('  @JOAO_AREIA  ').search, '@JOAO_AREIA');
  assert.equal(read('%_').search, '%_');
  assert.throws(() => read('x'.repeat(101)));
  assert.equal(read(' ').search, '');
  assert.equal(parseCommunitySearch(new URLSearchParams({search:' São ',offset:'20'})).p_search,'São');
  for(const offset of ['-1','NaN','1.5','10001']) assert.throws(()=>parseCommunitySearch(new URLSearchParams({offset})));
  assert.throws(()=>parseCommunitySearch(new URLSearchParams({search:'a'.repeat(101)})));
});
test('people search matches names and @handles, accents/case, and literal underscore', async () => {
  await asUser(db, ALICE, async () => {
    for (const term of ['joao', 'ACUCAR', '@JOAO_AREIA', ' joão ', 'Joa\u0303o', '_areia']) {
      const result = await db.query('select * from search_players($1)', [term]);
      assert.deepEqual(result.rows.map(p => p.id), [BOB], term);
    }
    for (const term of ['@açúcar', '@', '%', 'alice', "' OR 1=1 --", 'joao%']) {
      assert.equal((await db.query('select * from search_players($1)', [term])).rows.length, 0, term);
    }
    assert.equal((await db.query('select * from search_players($1,0,$2)', ['joao', BEACH])).rows.length, 0);
    assert.equal((await db.query('select * from search_players($1,0,null,$2)', ['joao', VILA])).rows.length, 0);
    await assert.rejects(db.query('select * from search_players($1)', ['x'.repeat(101)]), e => e.code === '23514');
  });
});
test('search filters before pagination and sorts an exact handle first', async () => {
  const ids=[];
  try {
    for (let n=0;n<27;n++) {
      const id=`39000000-0000-4000-8000-${String(n).padStart(12,'0')}`;ids.push(id);
      await db.query("insert into auth.users(id,email) values($1,$2)",[id,`search-${n}@example.invalid`]);
      await db.query("update profiles set display_name=$2,username=$3,onboarding_completed=true where id=$1",[id,n===26?'ZZZ Paginação':'AAA Paginação',`pag_${String(n).padStart(3,'0')}`]);
      await db.query('insert into player_sports(player_id,sport_id,level,is_primary) values($1,$2,\'Intermediário\',true)',[id,FUTEVOLEI]);
    }
    await asUser(db, ALICE, async () => {
      const first=(await db.query("select * from search_players('paginacao')")).rows;
      const second=(await db.query("select * from search_players('paginacao',24)")).rows;
      assert.equal(first.length,25);assert.equal(second.length,3);
      assert.equal(new Set([...first.slice(0,24),...second].map(p=>p.id)).size,27);
      assert.equal((await db.query("select * from search_players('@pag_026')")).rows[0].id,ids[26]);
    });
  } finally { await db.query('delete from auth.users where id=any($1::uuid[])',[ids]); }
});
test('people search preserves bilateral blocks, incomplete profiles and revoked admission', async () => {
  await asUser(db, BOB, () => db.query('insert into blocks(blocked_id) values($1)', [ALICE]));
  await asUser(db, ALICE, async () => assert.equal((await db.query("select * from search_players('joao')")).rows.length,0));
  await db.query('delete from blocks where blocker_id=$1',[BOB]);
  await db.query('update profiles set onboarding_completed=false where id=$1',[BOB]);
  await asUser(db, ALICE, async () => assert.equal((await db.query("select * from search_players('joao')")).rows.length,0));
  await db.query('update profiles set onboarding_completed=true where id=$1',[BOB]);
  await db.query("update pico_private.beta_admissions set status='revoked' where player_id=$1",[BOB]);
  await asUser(db, ALICE, async () => assert.equal((await db.query("select * from search_players('joao')")).rows.length,0));
  await asUser(db, BOB, async () => await assert.rejects(db.query("select * from search_players('alice')"),e=>e.code==='42501'));
  await db.query("update pico_private.beta_admissions set status='approved' where player_id=$1",[BOB]);
  await asUser(db, null, async () => await assert.rejects(db.query("select * from search_players('joao')"),e=>e.code==='42501'));
});
test('community search finds new groups without disclosing private content; symbols are literal', async () => {
  const group=(await asUser(db, BOB,()=>db.query(`select create_community($1) data`,[JSON.stringify({name:'Vôlei São João_100%',description:'Descrição restrita',rules:'Regras restritas',sports:[],visibility:'private',entry_mode:'approval'})]))).rows[0].data;
  await asUser(db, ALICE, async () => {
    const lookup=async(search,mine=false)=>(await db.query('select community_directory($1,$2) data',[search,mine])).rows[0].data;
    const result=await lookup('volei sao joao_100%');
    assert.equal(result.length,1);assert.equal(result[0].id,group.id);assert.equal(result[0].description,null);
    assert.equal(result[0].visibility,'private');assert.equal(result[0].entry_mode,'approval');
    assert.equal((await lookup('volei sao',true)).length,0);
    assert.equal((await lookup('joao_100X')).length,0);
    assert.equal((await lookup('%')).length,1);
    assert.equal('members' in result[0],false);
    await assert.rejects(db.query('select community_directory($1)',['x'.repeat(101)]),e=>e.code==='23514');
  });
  await asUser(db, null, async () => await assert.rejects(db.query("select community_directory('volei')"),e=>e.code==='42501'));
});

test('community filtering precedes pagination with a stable boundary', async () => {
  const ids=[];
  try {
    for(let n=0;n<23;n++) {
      const id=`49000000-0000-4000-8000-${String(n).padStart(12,'0')}`;ids.push(id);
      await db.query("insert into communities(id,slug,name,owner_id,entry_mode,visibility) values($1,$2,$3,$4,'open','beta')",[id,`search-page-${n}`,`Paginação teste ${String(n).padStart(2,'0')}`,BOB]);
    }
    await asUser(db,ALICE,async()=>{
      const first=(await db.query("select community_directory('paginacao teste',false,0) data")).rows[0].data;
      const second=(await db.query("select community_directory('paginacao teste',false,20) data")).rows[0].data;
      assert.equal(first.length,21);assert.equal(second.length,3);
      assert.equal(new Set([...first.slice(0,20),...second].map(g=>g.id)).size,23);
    });
  } finally { await db.query('delete from communities where id=any($1::uuid[])',[ids]); }
});

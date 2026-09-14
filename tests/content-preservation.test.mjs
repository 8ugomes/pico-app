import test from 'node:test';
import assert from 'node:assert/strict';
import { compareContentSnapshots, snapshotSql } from '../scripts/content-preservation.mjs';
import { createTestDatabase, ALICE, VILA } from './helpers/database.mjs';
const row={entity:'posts',key:'one',identity:'original-author-and-date',digest:'old-body'};
const snapshot=rows=>({format:1,projectRef:'fixture',rows});

test('release inventory detects missing or replaced history even when total counts match',()=>{
  const before=snapshot([row]);
  assert.equal(compareContentSnapshots(before,snapshot([{...row,key:'replacement'}])).preserved,false);
  assert.equal(compareContentSnapshots(before,snapshot([{...row,identity:'another-author'}])).preserved,false);
  assert.equal(compareContentSnapshots(before,snapshot([])).missing,1);
  assert.throws(()=>compareContentSnapshots(before,{...before,projectRef:'another-database'}));
  assert.throws(()=>compareContentSnapshots(before,snapshot([row,row])));
});
test('release inventory allows new contributions and reports edits without overwriting them',()=>{
  const result=compareContentSnapshots(snapshot([row]),snapshot([{...row,digest:'user-edited-body'},{...row,key:'two'}]));
  assert.equal(result.preserved,true);assert.equal(result.added,1);assert.equal(result.edited,1);
});
test('inventory SQL is read-only and emits identifiers and hashes without user content',async()=>{
  const db=await createTestDatabase();
  try {
    await db.query("insert into public.posts(author_id,body,distribution_explicit) values($1,'Texto que não deve sair no recibo',true)",[ALICE]);
    await db.query('insert into public.arena_members(arena_id,player_id) values($1,$2)',[VILA,ALICE]);
    const results=await db.exec(snapshotSql);
    const rows=results.flatMap(r=>r.rows??[]);
    assert.ok(rows.some(r=>r.entity==='posts'));
    assert.equal(JSON.stringify(rows).includes('Texto que não deve'),false);
    assert.equal(compareContentSnapshots(snapshot(rows),snapshot(rows)).preserved,true);
    assert.ok(rows.some(r=>r.entity==='arena_members'));
    assert.equal(compareContentSnapshots(snapshot(rows),snapshot(rows.filter(r=>r.entity!=='arena_members'))).preserved,false);
    assert.equal((await db.query('select count(*)::int n from public.posts')).rows[0].n,1);
  } finally {await db.close();}
});

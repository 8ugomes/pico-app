import test from 'node:test';
import assert from 'node:assert/strict';
import { compareContentSnapshots, snapshotSql } from '../scripts/content-preservation.mjs';
import { createTestDatabase, ALICE, VILA } from './helpers/database.mjs';
const row={entity:'posts',key:'one',identity:'original-author-and-date',digest:'old-body'};
const snapshot=rows=>({format:1,projectRef:'fixture',rows});
const resultRows=results=>results.flatMap(result=>result.rows??[]);

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
    const rows=resultRows(results);
    assert.ok(rows.some(r=>r.entity==='posts'));
    assert.equal(JSON.stringify(rows).includes('Texto que não deve'),false);
    assert.equal(compareContentSnapshots(snapshot(rows),snapshot(rows)).preserved,true);
    assert.ok(rows.some(r=>r.entity==='arena_members'));
    assert.equal(compareContentSnapshots(snapshot(rows),snapshot(rows.filter(r=>r.entity!=='arena_members'))).preserved,false);
    assert.equal((await db.query('select count(*)::int n from public.posts')).rows[0].n,1);
  } finally {await db.close();}
});

test('inventory SQL works before the additive direct-message tables exist',async()=>{
  const db=await createTestDatabase({through:'20260918130000_comment_idempotency.sql'});
  try {
    const rows=resultRows(await db.exec(snapshotSql));
    assert.ok(rows.some(item=>item.entity==='profiles'));
    assert.equal(rows.some(item=>item.entity.startsWith('direct_')),false);
    assert.equal(compareContentSnapshots(snapshot(rows),snapshot(rows)).preserved,true);
  } finally {await db.close();}
});

test('inventory SQL includes direct-message identities and hashes without message text',async()=>{
  const db=await createTestDatabase();
  try {
    const conversation=(await db.query(`insert into public.direct_conversations
      (participant_low,participant_high,last_message_at,last_sequence)
      values($1,$2,'2026-09-18T12:00:00Z',1) returning id`,[ALICE,'30000000-0000-4000-8000-000000000002'])).rows[0];
    const message=(await db.query(`insert into public.direct_messages
      (conversation_id,sender_id,sequence,client_key,body,created_at)
      values($1,$2,1,'40000000-0000-4000-8000-000000000001','Mensagem privada de teste','2026-09-18T12:00:00Z') returning id`,[conversation.id,ALICE])).rows[0];
    await db.query(`insert into public.direct_message_reads(conversation_id,player_id,last_read_sequence,read_at)
      values($1,$2,1,'2026-09-18T12:01:00Z')`,[conversation.id,ALICE]);

    const rows=resultRows(await db.exec(snapshotSql));
    assert.deepEqual(new Set(rows.filter(item=>item.entity.startsWith('direct_')).map(item=>item.entity)),new Set([
      'direct_conversations','direct_messages','direct_message_reads',
    ]));
    assert.ok(rows.some(item=>item.entity==='direct_conversations'&&item.key===conversation.id));
    assert.ok(rows.some(item=>item.entity==='direct_messages'&&item.key===message.id));
    assert.equal(JSON.stringify(rows).includes('Mensagem privada de teste'),false);
    assert.equal(compareContentSnapshots(snapshot(rows),snapshot(rows)).preserved,true);
  } finally {await db.close();}
});

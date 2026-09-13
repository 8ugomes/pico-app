// Called by the opt-in hosted suite with its two real disposable identities.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import sharp from 'sharp';

export async function hostedBeta({origin,a,b,guest,admin,anonymous,read,write,ok,denied,arenaId,sportId}) {
  let checks=0;
  const png=await sharp({create:{width:48,height:48,channels:3,background:'#4de1c1'}}).png().toBuffer();
  const cookie=actor=>[...actor.jar].map(([k,v])=>`${k}=${v}`).join('; ');
  async function http(actor,path,method='GET',body,contentType='application/json',status=200) {
    const response=await fetch(origin+path,{method,headers:{Cookie:cookie(actor),Origin:origin,...(body?{'Content-Type':contentType}:{})},body,redirect:'manual',signal:AbortSignal.timeout(45000)});
    assert.equal(response.status,status,`${method} ${path}: HTTP ${response.status}`);
    assert.match(response.headers.get('cache-control')??'',/no-store/);
    checks++;return response;
  }
  const upload=async(actor,bucket)=>{
    const response=await http(actor,`/api/media?bucket=${bucket}`,'POST',png,'image/png');
    const payload=await response.json(); assert.equal(payload.status,'success');assert.ok(payload.data.path.startsWith(actor.id+'/'));return payload.data.path;
  };
  const imageUrl=(bucket,path)=>`/api/media?bucket=${bucket}&path=${encodeURIComponent(path)}`;
  const avatar=await upload(a,'avatars'), photo=await upload(a,'post-media');
  await http(guest,'/api/media?bucket=avatars','POST',png,'image/png',401);
  await http(a,'/api/media?bucket=avatars','POST','<svg/>','image/svg+xml',415);
  await http(a,'/api/media?bucket=avatars','POST','not an image','image/png',400);
  await http(a,'/api/media?bucket=avatars','POST',Buffer.alloc(3*1024*1024+1),'image/png',413);
  await http(b,imageUrl('post-media',photo),'GET',undefined,undefined,404);
  await write(origin,a,{action:'set_avatar',path:avatar});
  await write(origin,a,{action:'create_post',arenaId,sportId,body:'Foto do beta hospedado',imagePath:photo});
  const lostBody=`Resposta descartada ${randomUUID()}`;
  const lost=await http(a,'/api/social/mutate','POST',JSON.stringify({action:'create_post',arenaId,sportId,body:lostBody}));
  await lost.body.cancel(); // Simulate losing the acknowledgment after commit.
  assert.equal((await read(origin,a,{resource:'feed',arenaId})).posts.filter(p=>p.body===lostBody).length,1);
  const profile=(await read(origin,b,{resource:'player',username:a.username})).profile;
  assert.equal(profile.avatar,imageUrl('avatars',avatar));
  const post=(await read(origin,b,{resource:'feed',arenaId})).posts.find(p=>p.imagePath===photo);assert.ok(post?.image);
  const image=await http(b,post.image);
  const metadata=await sharp(Buffer.from(await image.arrayBuffer())).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.exif,undefined);
  await http(b,profile.avatar);
  await http(guest,post.image,'GET',undefined,undefined,401);
  await write(origin,b,{action:'set_avatar',path:avatar},400);
  await write(origin,b,{action:'create_post',arenaId,sportId,body:'Forged photo',imagePath:photo},400);
  denied(await b.client.from('profiles').update({avatar_path:avatar}).eq('id',b.id),['23514'],'foreign avatar reference');
  denied(await b.client.from('posts').insert({arena_id:arenaId,sport_id:sportId,body:'Forged media',image_path:photo}),['23514'],'foreign post media');
  assert.ok((await b.client.storage.from('post-media').upload(`${a.id}/${randomUUID()}.webp`,png,{contentType:'image/webp'})).error);checks++;
  assert.ok((await a.client.storage.from('post-media').upload(`${a.id}/${randomUUID()}.webp`,png,{contentType:'image/webp'})).error);checks++;
  assert.ok((await a.client.storage.from('post-media').createSignedUrl(photo,60)).error);checks++;
  assert.ok((await a.client.storage.from('post-media').download(photo)).error);checks++;
  assert.ok((await anonymous.storage.from('post-media').download(photo)).error);checks++;
  const removed=await b.client.storage.from('post-media').remove([photo]);
  assert.ok(removed.error || removed.data?.length===0);checks++;
  await http(b,post.image);
  await http(b,'/api/media','DELETE',JSON.stringify({bucket:'post-media',path:photo}),undefined,404);
  await http(a,'/api/media','DELETE',JSON.stringify({bucket:'post-media',path:photo}),undefined,409);
  await write(origin,b,{action:'delete_post',id:post.id},404);
  assert.equal(ok(await b.client.from('posts').delete().eq('id',post.id).select('id'),'foreign post deletion').length,0);
  await write(origin,b,{action:'create_comment',postId:post.id,body:'Comentário do beta'});
  const comment=(await read(origin,a,{resource:'comments',postId:post.id})).comments.find(c=>c.authorId===b.id);
  await write(origin,a,{action:'delete_comment',id:comment.id},404);
  await write(origin,a,{action:'report',target:'comment',id:comment.id,reason:'other',details:'Teste descartável'});
  await write(origin,b,{action:'report',target:'post',id:post.id,reason:'spam',details:'Teste descartável'});
  await write(origin,b,{action:'report',target:'post',id:post.id,reason:'spam',details:'Repetida'},409);
  const reports=ok(await b.client.from('reports').select('id,reporter_id,status'),'own reports');
  assert.ok(reports.length && reports.every(r=>r.reporter_id===b.id && r.status==='pending'));
  assert.equal(ok(await a.client.from('reports').select('id').eq('id',reports[0].id),'other report visibility').length,0);
  denied(await b.client.from('reports').update({status:'dismissed'}).eq('id',reports[0].id),['42501'],'client moderation');
  ok(await admin.from('reports').update({status:'dismissed',reviewed_at:new Date().toISOString()}).eq('id',reports[0].id),'operator review');
  assert.equal((await read(origin,b,{resource:'account'})).reports.find(r=>r.id===reports[0].id).status,'dismissed');
  denied(await b.client.from('reports').insert({reporter_id:a.id,player_id:b.id,reason:'other'}),['42501'],'forged report author');
  denied(await anonymous.from('reports').select('id'),['42501'],'anonymous reports');
  denied(await b.client.from('media_assets').update({ready:true}).eq('player_id',a.id),['42501'],'client media approval');
  await write(origin,b,{action:'set_connection',playerId:a.id,connected:true});
  await write(origin,a,{action:'set_connection',playerId:b.id,connected:true});
  await write(origin,b,{action:'set_block',playerId:a.id,blocked:true});
  await read(origin,b,{resource:'player',username:a.username},404);
  await read(origin,a,{resource:'player',username:b.username},404);
  assert.ok(!(await read(origin,b,{resource:'feed'})).posts.some(p=>p.author_id===a.id));
  assert.ok(!(await read(origin,b,{resource:'discover'})).players.some(p=>p.id===a.id));
  await read(origin,b,{resource:'checkin'},400);
  denied(await b.client.from('checkins').select('id'),['42501'],'retired live history remains inaccessible');
  assert.equal(ok(await b.client.from('played_games').select('id').eq('player_id',a.id),'private game history').length,0);
  await http(b,post.image,'GET',undefined,undefined,404);
  await http(b,profile.avatar,'GET',undefined,undefined,404);
  assert.ok((await b.client.storage.from('post-media').download(photo)).error);checks++;
  assert.equal(ok(await b.client.from('posts').select('id').eq('id',post.id),'blocked direct post').length,0);
  await write(origin,b,{action:'set_like',postId:post.id,liked:true},403);
  await write(origin,b,{action:'create_comment',postId:post.id,body:'Blocked'},403);
  await write(origin,b,{action:'set_connection',playerId:a.id,connected:true},403);
  assert.equal((await read(origin,b,{resource:'account'})).blocks[0].blocked_id,a.id);
  assert.equal(ok(await a.client.from('blocks').delete().eq('blocker_id',b.id).select('blocked_id'),'foreign block delete').length,0);
  await write(origin,b,{action:'set_block',playerId:a.id,blocked:false});
  const restored=await read(origin,b,{resource:'player',username:a.username});assert.equal(restored.connected,false);
  await http(b,profile.avatar);
  await write(origin,b,{action:'delete_comment',id:comment.id});
  await write(origin,a,{action:'delete_post',id:post.id});
  await http(b,post.image,'GET',undefined,undefined,404);
  assert.equal(ok(await admin.from('media_assets').select('path').eq('path',photo),'post deletion removes media registration').length,0);
  await http(a,post.image,'GET',undefined,undefined,404);
  // Direct PostgREST bypass must hit the same transactional rate limit.
  let limited=false;
  for(let i=0;i<11;i++) {
    const result=await a.client.from('posts').insert({arena_id:arenaId,sport_id:sportId,body:`Quota test ${i}`});
    if(result.error){assert.equal(result.error.code,'P0429');limited=true;break;}
  }
  assert.equal(limited,true);checks++;
  await write(origin,a,{action:'create_post',arenaId,sportId,body:'Still limited'},429);
  // A fresh upload from B proves counters and ownership are independent.
  const bPhoto=await upload(b,'avatars');
  await write(origin,b,{action:'set_avatar',path:bPhoto});
  const reservations=await Promise.all(Array.from({length:4},()=>a.client.rpc('reserve_media',{p_bucket:'avatars'})));
  assert.equal(reservations.filter(r=>!r.error).length,2,'Concurrent reservations must respect the three-avatar limit');
  assert.ok(reservations.filter(r=>r.error).every(r=>r.error.code==='P0429'));checks++;
  // Real recovery token and password change; this deliberately does not claim
  // SMTP delivery or the e-mail PKCE callback has been exercised by this test.
  const recovery=ok(await admin.auth.admin.generateLink({type:'recovery',email:b.email}),'recovery token generation');
  ok(await b.client.auth.verifyOtp({type:'recovery',token_hash:recovery.properties.hashed_token}),'recovery token verification');
  const previousPassword=b.password; b.password=randomBytes(24).toString('base64url')+'aA9!';
  ok(await b.client.auth.updateUser({password:b.password}),'recovered password update');
  assert.ok((await b.client.auth.signInWithPassword({email:b.email,password:previousPassword})).error);checks++;
  ok(await b.client.auth.signInWithPassword({email:b.email,password:b.password}),'signin with recovered password');
  const originalId=a.id;
  await http(a,'/api/account','DELETE',JSON.stringify({confirmation:'EXCLUIR',password:'WrongPassword9!'}),undefined,403);
  await http(a,'/api/account','DELETE',JSON.stringify({confirmation:'EXCLUIR',password:a.password,userId:b.id}),undefined,400);
  assert.equal(ok(await admin.auth.admin.getUserById(b.id),'B remains before own deletion').user.id,b.id);
  await http(a,'/api/account','DELETE',JSON.stringify({confirmation:'EXCLUIR',password:a.password}));
  assert.ok((await admin.auth.admin.getUserById(originalId)).error);checks++;
  assert.equal(ok(await admin.from('profiles').select('id').eq('id',originalId),'deleted profile').length,0);
  assert.equal(ok(await admin.storage.from('avatars').list(originalId),'deleted avatar files').length,0);
  assert.equal(ok(await admin.storage.from('post-media').list(originalId),'deleted post files').length,0);
  assert.equal(ok(await a.client.from('profiles').select('id').limit(1),'old JWT after deletion').length,0);
  assert.equal((await read(origin,b,{resource:'profile'})).profile.id,b.id);
  await http(b,'/api/account','DELETE',JSON.stringify({confirmation:'EXCLUIR',password:b.password}));
  assert.equal(ok(await admin.storage.from('avatars').list(b.id),'B files removed').length,0);
  console.log(`${checks} extra hosted HTTP/Storage checks passed: media, blocking, reports, rate limit and account deletion.`);
  return checks;
}

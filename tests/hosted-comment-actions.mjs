// Isolated Auth/API/RLS exercise; retain only disposable development fixtures for manual UI review.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { assertRemoteIdentity } from '../scripts/environment-guard.mjs';
const environment=await assertRemoteIdentity(process.env,'hosted-test');
process.umask(0o077);
const origin='http://localhost:3002',output='.vercel/social-review';mkdirSync(output,{recursive:true});
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(environment.url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const fixture={projectRef:environment.projectRef,users:[],groups:[]};let checks=0;
const save=()=>writeFileSync(output+'/fixtures.json',JSON.stringify(fixture,null,2));
const check=(v,label)=>{assert.ok(v,label);checks++;};
const ok=(r,label)=>{check(!r.error,label+(r.error?': '+r.error.code:''));return r.data;};
const cookie=u=>[...u.jar].map(([k,v])=>k+'='+v).join('; ');
async function api(user,path,body,status=200){
  const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{Cookie:user?cookie(user):'',Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  check(r.status===status,`${path.split('?')[0]}: expected ${status}, got ${r.status}`);check(/no-store/.test(r.headers.get('cache-control')),'private response');
  return (await r.json()).data;
}
async function cleanup(saved=fixture){
  assert.equal(saved.projectRef,environment.projectRef);
  // A private post restricts deletion of its community; remove only fixture authors' posts first.
  for(const user of saved.users)ok(await admin.from('posts').delete().eq('author_id',user.id),'remove disposable posts');
  for(const id of saved.groups)ok(await admin.from('communities').delete().eq('id',id),'remove disposable group');
  for(const user of saved.users){
    for(const bucket of ['avatars','post-media']){
      const files=ok(await admin.storage.from(bucket).list(user.id,{limit:1000}),'fixture media inventory');
      if(files.length)ok(await admin.storage.from(bucket).remove(files.map(f=>user.id+'/'+f.name)),'remove fixture media');
    }
    ok(await admin.auth.admin.deleteUser(user.id),'remove disposable account');
  }
  writeFileSync(output+'/cleanup.json',JSON.stringify({completed:true,users:saved.users.length,groups:saved.groups.length,at:new Date().toISOString()}));
}
if(process.argv.includes('--cleanup')){await cleanup(JSON.parse(readFileSync(output+'/fixtures.json','utf8')));process.exit(0);}
async function account(label,index){
  const email='pico-comment-'+randomBytes(8).toString('hex')+'@example.com',password=index===0&&process.env.PICO_COMMENT_UI_PASSWORD||randomBytes(24).toString('base64url')+'Aa9!';
  const created=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create disposable account');
  fixture.users.push({id:created.user.id,email,password});save();
  const jar=new Map(),client=createServerClient(environment.url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(e=>e.value?jar.set(e.name,e.value):jar.delete(e.name))}});
  const user={id:created.user.id,client,jar};ok(await client.auth.signInWithPassword({email,password}),'real sign-in');
  const sports=(await api(user,'/api/social/read?resource=sports')).sports;
  const photo=await sharp({create:{width:256,height:256,channels:3,background:index?'#F2E3B5':'#CBBBE0'}}).png().toBuffer();
  const upload=await fetch(origin+'/api/media?bucket=avatars',{method:'POST',headers:{Cookie:cookie(user),Origin:origin,'Content-Type':'image/png'},body:photo,signal:AbortSignal.timeout(20000)});
  check(upload.ok,'upload controlled avatar');const path=(await upload.json()).data.path;
  await api(user,'/api/social/mutate',{action:'set_avatar',path});
  await api(user,'/api/social/mutate',{action:'save_profile',name:label,username:'revisao_'+user.id.replaceAll('-','').slice(0,12),bio:'Conta temporária para validar comentários.',city:'São Paulo',neighborhood:'Vila Mariana',sportId:sports[0].id,level:'Intermediário',available:false});
  ok(await client.rpc('pico_welcome',{p_acknowledge:true}),'acknowledge fixture welcome');return user;
}
let success=false;
try{
  const a=await account('Lia · teste',0),b=await account('Caio · teste',1);
  const post=await api(a,'/api/posts',{action:'publish',key:randomUUID(),body:'Primeiro treino na areia e uma turma que fez valer a manhã. Quem também jogou por aqui?',audience:'beta',groups:[]});
  const c1=ok(await b.client.from('comments').insert({post_id:post,body:'Foi bom demais! A última troca foi a melhor.'}).select('id').single(),'second person comment').id;
  const c2=ok(await a.client.from('comments').insert({post_id:post,body:'Valeu pela parceria! Já quero repetir.'}).select('id').single(),'own comment').id;
  fixture.post=post;fixture.comment=c2;save();
  await api(b,'/api/social/mutate',{action:'edit_comment',id:c1,body:'Foi bom demais! Aquela última troca valeu o treino.'});
  let comments=(await api(a,'/api/social/read?resource=comments&postId='+post)).comments;
  check(comments.length===2&&comments.every(c=>c.avatar?.startsWith('/api/media?')),'both comment avatars served through protected route');
  check(comments.some(c=>c.id===c1&&c.body.includes('valeu o treino')),'edit persisted');
  await api(a,'/api/social/mutate',{action:'edit_comment',id:c1,body:'Alheio'},404);
  await api(a,'/api/social/mutate',{action:'delete_comment',id:c1},404);
  await api(null,'/api/social/mutate',{action:'edit_comment',id:c1,body:'Anônimo'},401);
  for(const body of ['', 'x'.repeat(281)])await api(a,'/api/social/mutate',{action:'edit_comment',id:c2,body},400);
  await api(a,'/api/social/mutate',{action:'edit_comment',id:c2,body:'Texto',authorId:b.id},400);
  const temporary=ok(await a.client.from('comments').insert({post_id:post,body:'Comentário descartável para exclusão.'}).select('id').single(),'temporary deletion fixture').id;
  await api(a,'/api/social/mutate',{action:'delete_comment',id:temporary});
  comments=(await api(a,'/api/social/read?resource=comments&postId='+post)).comments;check(comments.length===2&&!comments.some(c=>c.id===temporary),'own delete and count persisted');
  const group=await api(a,'/api/communities',{action:'create',data:{name:'Revisão privada '+randomBytes(3).toString('hex'),description:'Fixture descartável',rules:'Teste',sports:[],visibility:'private',entry_mode:'open'}});fixture.groups.push(group.id);save();
  const privatePost=await api(a,'/api/posts',{action:'publish',key:randomUUID(),body:'Conteúdo de teste restrito',audience:'private',groups:[group.id]});
  await api(b,'/api/communities',{action:'membership',id:group.id,memberAction:'join'});
  const privateComment=ok(await b.client.from('comments').insert({post_id:privatePost,body:'Dentro do grupo'}).select('id').single(),'private comment').id;
  await api(b,'/api/communities',{action:'membership',id:group.id,memberAction:'leave'});
  await api(b,'/api/social/mutate',{action:'edit_comment',id:privateComment,body:'Fora do grupo'},404);
  ok(await b.client.from('blocks').insert({blocked_id:a.id}),'controlled block');
  await api(b,'/api/social/mutate',{action:'edit_comment',id:c1,body:'Bloqueado'},404);
  ok(await b.client.from('blocks').delete().eq('blocked_id',a.id),'restore fixture visibility');
  writeFileSync(output+'/hosted.json',JSON.stringify({passed:true,checks,projectRef:environment.projectRef,productionMutated:false,completedAt:new Date().toISOString()},null,2));
  console.log(JSON.stringify({passed:true,checks,post,retained:process.argv.includes('--keep')}));success=true;
}finally{if(!success||!process.argv.includes('--keep'))await cleanup();}

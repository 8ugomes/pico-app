// UI-only loopback preview of the REAL Next app. All /api calls are intercepted here.
// No credentials, external writes or database connection. Not imported by the product.
// Start Next on port 3003, then: node tests/helpers/visual-preview.mjs 3003 <build-version>
import {createServer, request} from 'node:http';
const sports=[{id:'10000000-0000-4000-8000-000000000002',slug:'beach-tennis',name:'Beach Tennis'},{id:'10000000-0000-4000-8000-000000000001',slug:'futevolei',name:'Futevôlei'},{id:'10000000-0000-4000-8000-000000000003',slug:'volei-de-praia',name:'Vôlei de Praia'}];
const arenas=[{id:'20000000-0000-4000-8000-000000000001',slug:'areia-da-vila',name:'Areia da Vila',description:'Um encontro depois do trabalho, uma partida a mais no fim de semana. Sua turma se encontra aqui.',neighborhood:'Vila Madalena',city:'São Paulo',image:'/images/urban-court.webp',isDemo:true,sports}, {id:'20000000-0000-4000-8000-000000000002',slug:'alto-da-areia',name:'Alto da Areia',description:'Areia, jogo e boa companhia.',neighborhood:'Pinheiros',city:'São Paulo',image:'/images/pico-court.webp',isDemo:true,sports}];
const profile={id:'30000000-0000-4000-8000-000000000001',username:'alice_teste',name:'Alice Teste',bio:'Mais uma partida e a gente vai.\nBeach tennis, encontros e boas histórias na areia.',city:'São Paulo',neighborhood:'Vila Madalena',available:true,isDemo:true,onboardingCompleted:true,avatar:null,avatarPath:null,sports:[{sport:sports[0],level:'Intermediário',isPrimary:true}]};
const community={id:'40000000-0000-4000-8000-000000000001',slug:'turma-do-fim-de-tarde',name:'Turma do fim de tarde',description:'Um espaço para combinar o próximo jogo e continuar a resenha.',rules:'Respeite o tempo de cada pessoa e combine os jogos com antecedência.',entry_mode:'approval',visibility:'beta',membership:'active',readable:true,rank:40,version:1,sports:[sports[0],sports[1]],owner:{id:profile.id,name:profile.name,username:profile.username},members:[{id:profile.id,name:profile.name,username:profile.username,role:'owner',status:'active'}],arena:null,avatar_path:null,cover_path:null};
const groups=[community];
const posts=[{id:'50000000-0000-4000-8000-000000000001',body:'Fim de tarde na areia, jogo bom e a turma de sempre. Quem chega para a próxima? 🌿',created_at:'2026-09-09T19:30:00Z',author_id:'30000000-0000-4000-8000-000000000002',username:'bruno_teste',display_name:'Bruno Teste',arena_id:arenas[0].id,arena_name:arenas[0].name,arena_slug:arenas[0].slug,arena_is_demo:true,sport_id:sports[0].id,sport_name:sports[0].name,sport_slug:sports[0].slug,like_count:4,comment_count:1,liked:false,image_path:null,avatar_path:null,audience:'beta',image:'/images/urban-court.webp',avatar:null,destinations:[]}];
const writes=[];let mode='success';
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:3002');
 const send=(data,status=200)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data))};
 if(url.pathname==='/__visual'){return send({fixture:true,writes,mode})}
 if(url.pathname==='/__visual/mode'){mode=url.searchParams.get('value')||'success';return send({mode})}
 if(url.pathname.startsWith('/api/')){
  let raw='';for await(const c of req){raw+=c;if(raw.length>32000)return send({message:'Fixture size limit'},413)}
  const body=raw?JSON.parse(raw):{};const kind=url.searchParams.get('kind');const resource=url.searchParams.get('resource');
  if(url.pathname==='/api/access')return send({admitted:true,signedIn:true,platformRole:'admin'});
  if(url.pathname==='/api/version')return send({version:process.argv[3]||'visual-fixture',environment:'test'});
  if(mode==='slow')await new Promise(r=>setTimeout(r,1500));
  if(mode==='error')return send({status:'error',code:'unavailable',message:'Não foi possível carregar agora. Confira sua conexão e tente novamente.'},503);
  if(req.method==='POST'){
   writes.push({path:url.pathname,body});
   if(url.pathname==='/api/communities'&&['create','edit'].includes(body.action)){
    const found=body.action==='edit'?groups.find(g=>g.id===body.id):null;
    const next={...community,...body.data,id:found?.id||'40000000-0000-4000-8000-'+String(groups.length+1).padStart(12,'0'),slug:found?.slug||'comunidade-visual-'+groups.length,sports:sports.filter(s=>body.data.sports.includes(s.id)),version:(found?.version||0)+1};
    if(found)Object.assign(found,next);else groups.push(next);return send({data:{id:next.id,slug:next.slug}})
   }
   if(url.pathname==='/api/posts'&&body.action==='publish'){posts.unshift({...posts[0],id:'50000000-0000-4000-8000-'+String(posts.length+1).padStart(12,'0'),body:body.body,author_id:profile.id,username:profile.username,display_name:profile.name,image:null,audience:body.audience,like_count:0,comment_count:0});return send({data:{id:posts[0].id}})}
   if(url.pathname==='/api/social/mutate'&&body.action==='save_profile'){Object.assign(profile,{name:body.name,username:body.username,bio:body.bio,city:body.city,neighborhood:body.neighborhood,available:body.available});return send({status:'success',message:'Perfil salvo.'})}
   return send({message:'Esta ação não faz parte da fixture visual.'},403);
  }
  if(url.pathname==='/api/communities')return send({data:kind==='page'?groups.find(g=>g.slug===url.searchParams.get('slug'))||null:kind==='invites'?[]:mode==='empty'?[]:groups.filter(g=>g.name.toLowerCase().includes((url.searchParams.get('search')||'').toLowerCase()))});
  if(url.pathname==='/api/posts')return send({data:kind==='options'?{arenas,communities:groups}:{posts:mode==='empty'?[]:posts,viewerId:profile.id,hasMore:false}});
  if(url.pathname==='/api/social/read'){
   const data=resource==='sports'?{kind:resource,sports}:resource==='arenas'?{kind:resource,arenas:mode==='empty'?[]:arenas,sports,hasMore:false,offset:0}:resource==='arena'?{kind:resource,arena:arenas.find(a=>a.slug===url.searchParams.get('slug'))||arenas[0]}:resource==='profile'?{kind:resource,profile}:resource==='player'?{kind:resource,profile:{...profile,name:'Bruno Teste',username:'bruno_teste'},own:false,connected:false}:resource==='account'?{kind:resource,viewerId:profile.id,deletionPending:false,blocks:[],reports:[],media:[]}:resource==='discover'?{kind:resource,hasMore:false,players:mode==='empty'?[]:[{id:posts[0].author_id,display_name:'Bruno Teste',username:'bruno_teste',bio:'Jogo no fim de tarde.',city:'São Paulo',neighborhood:'Pinheiros',sport_slug:sports[0].slug,sport_name:sports[0].name,level:'Intermediário',available:true,connected:false,is_demo:true,avatar:null,arena_name:null,arena_slug:null,expires_at:null}]}:resource==='comments'?{kind:resource,comments:[{id:'comment-fixture',authorId:profile.id,body:'Vamos combinar a próxima!',createdAt:posts[0].created_at,name:profile.name,username:profile.username}],hasMore:false,viewerId:profile.id}:{kind:'checkin',own:null,presence:[]};return send({status:'success',data});
  }
  if(url.pathname==='/api/activity')return send({data:kind==='places'?{own:true,share_activity_summary:false,arenas,communities:groups}:kind==='summary'?{total:0,arenas:[]}:[]});
  if(url.pathname==='/api/manage')return send({data:url.searchParams.has('context')?url.searchParams.get('context')==='catalog'?{arenas:[],communities:[]}:[]:{platformRole:'admin',arenas:[],communities:groups}});
  if(url.pathname==='/api/arenas')return send({data:kind==='team'?{staff:[],members:[]}:kind?[]:{...arenas[0],public_info:'Quadras ao ar livre. Combine sua chegada com a turma.',avatar_path:null,cover_path:null,version:1,rank:40,is_demo:true,membership:'active',owner:community.owner,staff:[]}});
  return send({data:[]});
 }
 // Only static/page traffic reaches local Next. Never forward cookies or API traffic.
 const upstream=request({hostname:'127.0.0.1',port:Number(process.argv[2]||3003),path:req.url,method:'GET',headers:{accept:req.headers.accept||'*/*','accept-encoding':'identity',...(req.headers.rsc?{rsc:req.headers.rsc}:{})}},r=>{const headers={...r.headers};delete headers['set-cookie'];res.writeHead(r.statusCode,headers);r.pipe(res)});
 upstream.on('error',()=>send({message:'Start the existing Next app on port 3003.'},502));upstream.end();
});
server.listen(3002,'127.0.0.1',()=>console.log('UI fixture: http://127.0.0.1:3002 — all APIs simulated, no remote writes'));

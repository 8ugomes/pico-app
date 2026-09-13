// UI-only loopback preview of the REAL Next app. All /api calls are intercepted here.
// No credentials, external writes or database connection. Not imported by the product.
// Start Next on port 3003, then: node tests/helpers/visual-preview.mjs 3003 <build-version>
import {createServer, request} from 'node:http';
const sports=[{id:'10000000-0000-4000-8000-000000000002',slug:'beach-tennis',name:'Beach Tennis'},{id:'10000000-0000-4000-8000-000000000001',slug:'futevolei',name:'Futevôlei'},{id:'10000000-0000-4000-8000-000000000003',slug:'volei-praia',name:'Vôlei de Praia'}];
const arenas=[{id:'20000000-0000-4000-8000-000000000001',slug:'areia-da-vila',name:'Areia da Vila',description:'Um encontro depois do trabalho, uma partida a mais no fim de semana. Sua turma se encontra aqui.',neighborhood:'Vila Madalena',city:'São Paulo',image:'/images/urban-court.webp',isDemo:true,sports}, {id:'20000000-0000-4000-8000-000000000002',slug:'alto-da-areia',name:'Alto da Areia',description:'Areia, jogo e boa companhia.',neighborhood:'Pinheiros',city:'São Paulo',image:'/images/pico-court.webp',isDemo:true,sports}];
const profile={id:'30000000-0000-4000-8000-000000000001',username:'alice_teste',name:'Alice Teste',bio:'Mais uma partida e a gente vai.\nBeach tennis, encontros e boas histórias na areia.',city:'São Paulo',neighborhood:'Vila Madalena',available:true,isDemo:true,onboardingCompleted:true,avatar:null,avatarPath:null,sports:[{sport:sports[0],level:'Intermediário',isPrimary:true}]};
const community={id:'40000000-0000-4000-8000-000000000001',slug:'turma-do-fim-de-tarde',name:'Turma do fim de tarde',description:'Um espaço para combinar o próximo jogo e continuar a resenha.',rules:'Respeite o tempo de cada pessoa e combine os jogos com antecedência.',entry_mode:'approval',visibility:'beta',membership:'active',readable:true,rank:40,version:1,sports:[sports[0],sports[1]],owner:{id:profile.id,name:profile.name,username:profile.username},members:[{id:profile.id,name:profile.name,username:profile.username,role:'owner',status:'active'}],arena:null,avatar_path:null,cover_path:null};
const groups=[community];
const posts=[{id:'50000000-0000-4000-8000-000000000001',body:'Fim de tarde na areia, jogo bom e a turma de sempre. Quem chega para a próxima? 🌿',created_at:'2026-09-09T19:30:00Z',author_id:'30000000-0000-4000-8000-000000000002',username:'bruno_teste',display_name:'Bruno Teste',arena_id:arenas[0].id,arena_name:arenas[0].name,arena_slug:arenas[0].slug,arena_is_demo:true,sport_id:sports[0].id,sport_name:sports[0].name,sport_slug:sports[0].slug,like_count:4,comment_count:1,liked:false,image_path:null,avatar_path:null,audience:'beta',image:'/images/urban-court.webp',avatar:null,destinations:[{arena_id:arenas[0].id,community_id:null},{arena_id:null,community_id:community.id,community_name:community.name,community_slug:community.slug}]}];
const writes=[];const games=[];const deletedGames=new Set();const publicationKeys=new Map();let mode='success',following=true,connected=false;
const visibleGroup=()=>mode==='pending'?{...community,visibility:'private',membership:'pending',readable:false,rank:0,rules:null,sports:[],owner:null,members:[]}:mode==='visitor'?{...community,membership:null,rank:0}:community;
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:3002');
 const send=(data,status=200)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data))};
 if(url.pathname==='/__visual'){return send({fixture:true,writes,mode,games,posts:posts.length})}
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
   if(url.pathname==='/api/games'){
    if(body.action==='delete'){const i=games.findIndex(g=>g.id===body.id);if(i>=0)games.splice(i,1);deletedGames.add(body.id);return send({data:{id:body.id}})}
    if(deletedGames.has(body.id))return send({message:'Este registro foi excluído.'},409);
    const old=games.find(g=>g.id===body.id),arena=arenas.find(a=>a.id===body.arenaId),sport=sports.find(s=>s.id===body.sportId);
    if(!arena||!sport)return send({message:'Confira a arena e modalidade.'},400);
    if(old && (old.played_on!==body.playedOn||old.arena_id!==body.arenaId||old.sport_id!==body.sportId)&&body.version!==old.version)return send({message:'Confira a versão atual do jogo.'},409);
    if(!old||old.played_on!==body.playedOn||old.arena_id!==body.arenaId||old.sport_id!==body.sportId){const next={id:body.id,arena_id:arena.id,arena_slug:arena.slug,arena_name:arena.name,is_demo:true,sport_id:sport.id,sport_name:sport.name,sport_slug:sport.slug,played_on:body.playedOn,created_at:old?.created_at||new Date().toISOString(),updated_at:new Date().toISOString(),version:(old?.version||0)+1};if(old)Object.assign(old,next);else games.unshift(next)}
    if(mode==='lost-response'){mode='success';return send({message:'A confirmação não chegou. Tente novamente sem alterar os campos.'},503)}
    return send({data:{id:body.id}})
   }
   if((url.pathname==='/api/posts'&&body.action==='publish')||url.pathname==='/api/games/share'){
    const previous=publicationKeys.get(body.key);if(previous)return send({data:previous});
    const game=url.pathname==='/api/games/share'?games.find(g=>g.id===body.id&&g.version===body.version):null;
    if(url.pathname==='/api/games/share'&&!game)return send({message:'Confira a versão atual do seu jogo.'},409);
    const arena=arenas.find(a=>a.id===(game?.arena_id||body.arena));
    const post={...posts[0],id:'50000000-0000-4000-8000-'+String(posts.length+1).padStart(12,'0'),body:body.body||(game?`Joguei em ${game.arena_name}.`:''),created_at:new Date().toISOString(),author_id:profile.id,username:profile.username,display_name:profile.name,image:null,audience:body.audience,like_count:0,comment_count:0,game_played_on:game?.played_on||null,arena_id:arena?.id||null,arena_name:arena?.name||null,arena_slug:arena?.slug||null,destinations:[...(body.wallArena?[{arena_id:body.wallArena,community_id:null}]:[]),...(body.groups||[]).map(id=>({arena_id:null,community_id:id,community_name:groups.find(g=>g.id===id)?.name,community_slug:groups.find(g=>g.id===id)?.slug}))]};posts.unshift(post);publicationKeys.set(body.key,post.id);
    if(mode==='lost-response'){mode='success';return send({message:'A confirmação não chegou. Repita sem mudar os campos.'},503)}
    return send({data:post.id})
   }
   if(url.pathname==='/api/communities'&&body.action==='membership'){community.membership=body.memberAction==='leave'?null:community.entry_mode==='approval'?'pending':'active';community.rank=community.membership==='active'?10:0;mode='success';return send({data:null})}
   if(url.pathname==='/api/arenas'&&body.action==='follow'){following=body.join;return send({data:null})}
   if(url.pathname==='/api/social/mutate'&&body.action==='set_connection'){connected=body.connected;return send({status:'success'})}
   if(url.pathname==='/api/social/mutate'&&['set_like','create_comment'].includes(body.action))return send({status:'success'});
   if(url.pathname==='/api/social/mutate'&&body.action==='save_profile'){Object.assign(profile,{name:body.name,username:body.username,bio:body.bio,city:body.city,neighborhood:body.neighborhood,available:body.available});return send({status:'success',message:'Perfil salvo.'})}
   return send({message:'Esta ação não faz parte da fixture visual.'},403);
  }
  if(url.pathname==='/api/communities')return send({data:kind==='page'?(url.searchParams.get('slug')===community.slug?visibleGroup():groups.find(g=>g.slug===url.searchParams.get('slug'))||null):kind==='invites'?[]:mode==='empty'?[]:groups.filter(g=>(url.searchParams.get('mine')!=='true'||['active','pending'].includes(g.membership))&&g.name.toLowerCase().includes((url.searchParams.get('search')||'').toLowerCase()))});
  if(url.pathname==='/api/posts')return send({data:kind==='options'?{arenas:following?arenas:[],communities:groups.filter(g=>g.membership==='active')}:{posts:mode==='empty'?[]:posts.filter(p=>(!url.searchParams.has('post')||p.id===url.searchParams.get('post'))&&(!url.searchParams.has('author')||p.author_id===url.searchParams.get('author'))&&(!url.searchParams.has('community')||p.destinations.some(d=>d.community_id===url.searchParams.get('community')))),viewerId:profile.id,hasMore:false}});
  if(url.pathname==='/api/games/legacy')return send({data:[]});
  if(url.pathname==='/api/games')return send({data:mode==='empty'?[]:games});
  if(url.pathname==='/api/social/read'){
   const data=resource==='sports'?{kind:resource,sports}:resource==='arenas'?{kind:resource,arenas:mode==='empty'?[]:arenas,sports,hasMore:false,offset:0}:resource==='arena'?{kind:resource,arena:arenas.find(a=>a.slug===url.searchParams.get('slug'))||arenas[0]}:resource==='profile'?{kind:resource,profile}:resource==='player'?{kind:resource,profile:{...profile,id:'30000000-0000-4000-8000-000000000002',name:'Bruno Teste',username:'bruno_teste'},own:false,connected}:resource==='account'?{kind:resource,viewerId:profile.id,deletionPending:false,blocks:[],reports:[],media:[]}:resource==='discover'?{kind:resource,hasMore:false,players:mode==='empty'?[]:[{id:'30000000-0000-4000-8000-000000000002',display_name:'Bruno Teste',username:'bruno_teste',bio:'Jogo no fim de tarde.',city:'São Paulo',neighborhood:'Pinheiros',sport_slug:sports[0].slug,sport_name:sports[0].name,level:'Intermediário',connected,is_demo:true,avatar:null}]}:resource==='comments'?{kind:resource,comments:[{id:'comment-fixture',authorId:profile.id,body:'Vamos combinar a próxima!',createdAt:posts[0].created_at,name:profile.name,username:profile.username}],hasMore:false,viewerId:profile.id}:{kind:'sports',sports};return send({status:'success',data});
  }
  if(url.pathname==='/api/activity')return send({data:kind==='places'?{own:!url.searchParams.has('player')||url.searchParams.get('player')===profile.id,arenas:mode==='empty'||!following?[]:arenas,communities:mode==='empty'?[]:groups.filter(g=>g.membership==='active')}:kind==='summary'?{total:0,arenas:[]}:[]});
  if(url.pathname==='/api/manage')return send({data:url.searchParams.has('context')?url.searchParams.get('context')==='catalog'?{arenas:[],communities:[]}:[]:{platformRole:'admin',arenas:[],communities:groups}});
  if(url.pathname==='/api/arenas')return send({data:kind==='team'?{staff:[],members:[]}:kind?[]:{...arenas[0],public_info:'Quadras ao ar livre. Combine sua chegada com a turma.',avatar_path:null,cover_path:null,version:1,rank:40,is_demo:true,membership:following?'active':null,owner:community.owner,staff:[]}});
  return send({data:[]});
 }
 // Only static/page traffic reaches local Next. Never forward cookies or API traffic.
 const upstream=request({hostname:'127.0.0.1',port:Number(process.argv[2]||3003),path:req.url,method:'GET',headers:{accept:req.headers.accept||'*/*','accept-encoding':'identity',...(req.headers.rsc?{rsc:req.headers.rsc}:{})}},r=>{const headers={...r.headers};delete headers['set-cookie'];if(mode==='large-text' && String(headers['content-type']).includes('text/html')){delete headers['content-length'];delete headers['transfer-encoding'];headers['cache-control']='no-store';let html='';r.setEncoding('utf8');r.on('data',c=>html+=c);r.on('end',()=>{res.writeHead(r.statusCode,headers);res.end(html.replace('</head>','<style>:root{font-size:200%}</style></head>'))})}else{res.writeHead(r.statusCode,headers);r.pipe(res)}});
 upstream.on('error',()=>send({message:'Start the existing Next app on port 3003.'},502));upstream.end();
});
server.listen(3002,'127.0.0.1',()=>console.log('UI fixture: http://127.0.0.1:3002 — all APIs simulated, no remote writes'));

// Optional local test control, e.g. pipe or type: mode error / mode success.
process.stdin.setEncoding('utf8');
process.stdin.on('data',chunk=>{for(const line of chunk.split('\n')){const match=/^mode (success|empty|error|slow|pending|visitor|lost-response|large-text)$/.exec(line.trim());if(match){mode=match[1];console.log('Fixture mode:',mode)}}});

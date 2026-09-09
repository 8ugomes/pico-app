// Explicit local transport fixture for manual UI/API verification, not Supabase Auth/PostgREST.
// Runs only when invoked directly. Never imported into the app or deployed as an API.
import { createServer } from 'node:http';
import { createTestDatabase, asUser, ALICE } from './database.mjs';
const db=await createTestDatabase();
let mode='success';
let queue=Promise.resolve();
const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload=Buffer.from(JSON.stringify({sub:ALICE,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
// Not signed or accepted anywhere except this loopback fixture.
const token=`${header}.${payload}.fixture-only-not-a-real-signature`;
const user={id:ALICE,email:'alice-ui@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-09-09T00:00:00Z'};
const server=createServer((req,res)=>{
  const run=async()=>{
    const url=new URL(req.url,'http://127.0.0.1');
    if(req.headers.origin==='http://localhost:3002') {res.setHeader('Access-Control-Allow-Origin','http://localhost:3002'); res.setHeader('Access-Control-Allow-Headers','authorization, apikey, content-type, x-client-info, x-supabase-api-version'); res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
    if(req.method==='OPTIONS') {res.writeHead(204);return res.end();}
    const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    if(url.pathname==='/fixture-mode' && req.method==='POST') {mode=url.searchParams.get('value')||'success';return send({fixture:true,mode});}
    if(url.pathname==='/auth/v1/token') return send({access_token:token,refresh_token:'fixture-only-refresh',token_type:'bearer',expires_in:3600,user});
    if(url.pathname==='/auth/v1/user') return req.headers.authorization===`Bearer ${token}`?send(user):send({message:'Fixture identity missing'},401);
    if(url.pathname==='/auth/v1/logout') return send({});
    if(!url.pathname.startsWith('/rest/v1/')) return send({message:'Fixture endpoint missing'},404);
    if(mode==='error') return send({message:'Internal fixture failure; must not reach product UI',code:'42P01'},400);
    if(mode==='slow') await new Promise(resolve=>setTimeout(resolve,2000));
    if(mode==='empty') return send([]);
    const identity=req.headers.authorization===`Bearer ${token}`?ALICE:null;
    const table=url.pathname.split('/').at(-1);
    try {
      const result=await asUser(db,identity,async()=>{
        if(table==='sports') return (await db.query('select * from sports order by name')).rows;
        if(table==='arenas') {
          const slug=url.searchParams.get('slug')?.slice(3)??null;
          const offset=Number(url.searchParams.get('offset')??0);
          const limit=Number(url.searchParams.get('limit')??25);
          return (await db.query(`select a.*,coalesce(jsonb_agg(jsonb_build_object('sports',to_jsonb(s))) filter(where s.id is not null),'[]') as arena_sports from arenas a left join arena_sports x on a.id=x.arena_id left join sports s on s.id=x.sport_id where ($1::text is null or a.slug=$1) group by a.id order by a.name,a.id offset $2 limit $3`,[slug,offset,limit])).rows;
        }
        if(table==='profiles') return (await db.query(`select p.*,coalesce(jsonb_agg(jsonb_build_object('sports',to_jsonb(s),'level',x.level,'is_primary',x.is_primary)) filter(where s.id is not null),'[]') as player_sports from profiles p left join player_sports x on p.id=x.player_id left join sports s on s.id=x.sport_id where p.id=$1 group by p.id`,[url.searchParams.get('id')?.slice(3)??ALICE])).rows;
        throw new Error('Unsupported fixture table');
      });
      send(result);
    } catch {send({message:'Fixture query denied',code:'42501'},403);}
  };
  queue=queue.then(run).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();});
});
server.listen(54331,'127.0.0.1',()=>console.log('Local read fixture on 127.0.0.1:54331 (SQL real; Auth/REST simulated)'));
process.on('SIGINT',()=>server.close(async()=>{await db.close();process.exit(0);}));

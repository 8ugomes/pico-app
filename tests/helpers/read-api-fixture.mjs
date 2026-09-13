// Loopback-only UI fixture. PostgreSQL migrations/RLS are real; Auth and REST transport are simulated.
// Never imported by the app. Accepts only @example.invalid test identities.
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ALICE, BOB, FUTEVOLEI, VILA } from './database.mjs';
const db = await createTestDatabase();
await asUser(db, BOB, async () => {
  await db.query(`select save_profile('Bruno Teste','bruno_teste','Jogo de tarde.','São Paulo','Pinheiros',$1,'Intermediário',true)`, [FUTEVOLEI]);
  await db.query('select set_arena_membership($1,true)', [VILA]);
});
const accounts = new Map([['alice-ui@example.invalid', { id: ALICE, name: 'Alice Teste' }], ['bruno-ui@example.invalid', { id: BOB, name: 'Bruno Teste' }]]);
const tokens = new Map();
const refreshTokens = new Map();
let mode = 'success';
let queue = Promise.resolve();
function authUser(email, account) { return { id: account.id, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { display_name: account.name }, created_at: new Date().toISOString() }; }
function session(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600, jti: randomUUID() })).toString('base64url');
  const token = `${header}.${payload}.fixture-only-not-a-real-signature`;
  const refresh = `fixture-refresh-${randomUUID()}`;
  tokens.set(token, user); refreshTokens.set(refresh, user);
  return { access_token: token, refresh_token: refresh, token_type: 'bearer', expires_in: 3600, user };
}
const server = createServer((req, res) => {
  const run = async () => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.headers.origin === 'http://localhost:3002') {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3002');
      res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info, x-supabase-api-version');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    let text = '';
    for await (const chunk of req) { text += chunk; if (text.length > 16384) return send({ message: 'Fixture payload too large' }, 413); }
    const body = text ? JSON.parse(text) : {};
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    const user = tokens.get(token);
    if (url.pathname === '/fixture-mode' && req.method === 'POST') { mode = url.searchParams.get('value') || 'success'; return send({ fixture: true, mode }); }
    if (url.pathname === '/auth/v1/signup') {
      if (!body.email?.endsWith('@example.invalid')) return send({ code: 'email_address_invalid' }, 400);
      if (accounts.has(body.email)) return send({ code: 'user_already_exists' }, 400);
      const account = { id: randomUUID(), name: body.data?.display_name || 'Novo jogador' };
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [account.id, body.email, JSON.stringify(body.data || {})]);
      await db.query("insert into pico_private.beta_admissions(player_id,status) values($1,'approved')",[account.id]);
      accounts.set(body.email, account); return send(session(authUser(body.email, account)));
    }
    if (url.pathname === '/auth/v1/token') {
      if (url.searchParams.get('grant_type') === 'refresh_token') { const u = refreshTokens.get(body.refresh_token); return u ? send(session(u)) : send({ code: 'refresh_token_not_found' }, 400); }
      const account = accounts.get(body.email);
      return account && body.password === 'PicoTeste123!' ? send(session(authUser(body.email, account))) : send({ code: 'invalid_credentials' }, 400);
    }
    if (url.pathname === '/auth/v1/user') return mode === 'auth_error' ? send({ message: 'Fixture auth failure' }, 503) : user ? send(user) : send({ message: 'Fixture identity missing' }, 401);
    if (url.pathname === '/auth/v1/logout') { tokens.delete(token); for (const [key, u] of refreshTokens) if (u.id === user?.id) refreshTokens.delete(key); return send({}); }
    if (!url.pathname.startsWith('/rest/v1/')) return send({ message: 'Fixture endpoint missing' }, 404);
    if (mode === 'error') return send({ message: 'Internal fixture failure; must not reach product UI', code: '42P01' }, 400);
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 2000));
    const table = url.pathname.split('/').at(-1);
    const eq = key => url.searchParams.get(key)?.replace(/^eq\./, '') ?? null;
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 25);
    if (mode === 'empty' && (req.method === 'GET' || ['read_feed', 'discover_players'].includes(table))) return send([]);
    try {
      const result = await asUser(db, user?.id ?? null, async () => {
        if (url.pathname.includes('/rpc/')) {
          const rpc = {
            save_profile: ['p_name','p_username','p_bio','p_city','p_neighborhood','p_sport_id','p_level','p_available'],
            set_arena_membership: ['p_arena','p_join'], read_played_games: ['p_offset'], save_played_game: ['p_id','p_arena','p_sport','p_played_on','p_version'], delete_played_game: ['p_id'], read_retired_checkins: ['p_offset'],
            read_feed: ['p_offset','p_arena_id'], discover_players: ['p_offset','p_sport_id','p_arena_id','p_level','p_active'],
          }[table];
          if (!rpc) throw new Error('Unsupported fixture RPC');
          const args = rpc.map(k => body[k] ?? (k === 'p_offset' ? 0 : k === 'p_active' ? false : null));
          const rows = (await db.query(`select * from public.${table}(${rpc.map((_, i) => `$${i+1}`).join(',')})`, args)).rows;
          return ['read_feed','discover_players'].includes(table) ? rows : Object.values(rows[0] ?? {})[0] ?? null;
        }
        if (req.method === 'POST') {
          const allowed = { posts: ['author_id','arena_id','sport_id','body'], comments: ['author_id','post_id','body'], post_likes: ['player_id','post_id'], connections: ['follower_id','followed_id'] }[table];
          const keys = Object.keys(body);
          if (!allowed || !keys.length || keys.some(k => !allowed.includes(k))) throw new Error('Unsupported fixture write');
          await db.query(`insert into public.${table}(${keys.join(',')}) values(${keys.map((_, i) => `$${i+1}`).join(',')})`, keys.map(k => body[k]));
          return null;
        }
        if (req.method === 'DELETE') {
          if (table === 'post_likes') await db.query('delete from post_likes where post_id=$1 and player_id=$2', [eq('post_id'), eq('player_id')]);
          else if (table === 'connections') await db.query('delete from connections where follower_id=$1 and followed_id=$2', [eq('follower_id'), eq('followed_id')]);
          else throw new Error('Unsupported fixture delete');
          return null;
        }
        if (table === 'sports') return (await db.query('select * from sports order by name')).rows;
        if (table === 'arenas') return (await db.query(`select a.*,coalesce(jsonb_agg(jsonb_build_object('sports',to_jsonb(s))) filter(where s.id is not null),'[]') as arena_sports from arenas a left join arena_sports x on a.id=x.arena_id left join sports s on s.id=x.sport_id where ($1::text is null or a.slug=$1) group by a.id order by a.name,a.id offset $2 limit $3`, [eq('slug'), offset, limit])).rows;
        if (table === 'profiles') return (await db.query(`select p.*,coalesce(jsonb_agg(jsonb_build_object('sports',to_jsonb(s),'level',x.level,'is_primary',x.is_primary)) filter(where s.id is not null),'[]') as player_sports from profiles p left join player_sports x on p.id=x.player_id left join sports s on s.id=x.sport_id where ($1::uuid is null or p.id=$1) and ($2::text is null or p.username=$2) group by p.id`, [eq('id'), eq('username')])).rows;
        if (table === 'comments') return (await db.query(`select c.*, jsonb_build_object('display_name',p.display_name,'username',p.username) profiles from comments c join profiles p on p.id=c.author_id where c.post_id=$1 order by c.created_at,c.id offset $2 limit $3`, [eq('post_id'), offset, limit])).rows;
        if (table === 'connections') return (await db.query('select followed_id from connections where follower_id=$1 and followed_id=$2', [eq('follower_id'), eq('followed_id')])).rows;
        throw new Error('Unsupported fixture table');
      });
      send(result);
    } catch (error) { send({ message: 'Fixture SQL rejected the operation', code: error.code ?? 'FIXTURE' }, error.code === '42501' ? 403 : 400); }
  };
  queue = queue.then(run).catch(() => { if (!res.headersSent) res.writeHead(500); res.end(); });
});
server.listen(54331, '127.0.0.1', () => console.log('Local fixture on 127.0.0.1:54331 (SQL real; Auth/REST simulated)'));
process.on('SIGINT', () => server.close(async () => { await db.close(); process.exit(0); }));

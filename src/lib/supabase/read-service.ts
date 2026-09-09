import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { ReadArena, ReadData, ReadRequest, ReadPresence, ReadProfile } from '../../types/read';
import { ARENA_PAGE_SIZE, getArenaBySlug, getOwnProfile, listPublicArenas, listSports, requireUser, getPublicProfile } from './queries.ts';
import { levels, uuidPattern } from './mutations.ts';
import type { Level } from '../../types/social';
import { ReadError } from './read-errors.ts';
import { mediaUrl } from './media.ts';

type ArenaResult = NonNullable<Awaited<ReturnType<typeof getArenaBySlug>>['data']>;
// Only bundled illustration paths are ready; remote/private Storage images arrive later.
export function safeArenaImage(path: string | null, isDemo: boolean) {
  return isDemo && path === '/images/urban-court.webp' ? path : null;
}
function arenaDto(row: ArenaResult): ReadArena {
  return {
    id: row.id, slug: row.slug, name: row.name, description: row.description,
    neighborhood: row.neighborhood, city: row.city, image: safeArenaImage(row.image_path, row.is_demo), isDemo: row.is_demo,
    sports: row.arena_sports.flatMap(link => link.sports ? [link.sports] : []),
  };
}
export function parseReadRequest(params: URLSearchParams): ReadRequest {
  const resource = params.get('resource');
  if (resource === 'player') {
    const username = params.get('username') ?? '';
    if (!/^[a-z0-9_]{3,40}$/.test(username)) throw new ReadError('invalid_request', 400);
    return { resource, username };
  }
  if (resource === 'discover') {
    const offset = params.get('offset') ?? '0';
    const sportId = params.get('sportId') ?? undefined;
    const arenaId = params.get('arenaId') ?? undefined;
    const level = params.get('level') as Level | null;
    const active = params.get('active') ?? 'false';
    if (!/^\d{1,5}$/.test(offset) || Number(offset) > 10000 || (sportId && !uuidPattern.test(sportId)) || (arenaId && !uuidPattern.test(arenaId)) || (level && !levels.includes(level)) || !['true', 'false'].includes(active)) throw new ReadError('invalid_request', 400);
    return { resource, offset: Number(offset), sportId, arenaId, level: level ?? undefined, active: active === 'true' };
  }
  if (resource === 'feed' || resource === 'comments') {
    const value = params.get('offset') ?? '0';
    if (!/^\d{1,5}$/.test(value) || Number(value) > 10000) throw new ReadError('invalid_request', 400);
    const id = params.get(resource === 'feed' ? 'arenaId' : 'postId');
    if ((resource === 'comments' && !id) || (id && !uuidPattern.test(id))) throw new ReadError('invalid_request', 400);
    return resource === 'feed' ? { resource, offset: Number(value), arenaId: id ?? undefined } : { resource, offset: Number(value), postId: id! };
  }
  if (resource === 'checkin') {
    const arenaId = params.get('arenaId') ?? undefined;
    if (arenaId && !uuidPattern.test(arenaId)) throw new ReadError('invalid_request', 400);
    return { resource, arenaId };
  }
  if (resource === 'sports') return { resource };
  if (resource === 'profile' || resource === 'account') return { resource };
  if (resource === 'arenas') {
    const value = params.get('offset') ?? '0';
    if (!/^\d{1,5}$/.test(value) || Number(value) > 10000) throw new ReadError('invalid_request', 400);
    return { resource, offset: Number(value) };
  }
  if (resource === 'arena') {
    const slug = params.get('slug') ?? '';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) throw new ReadError('invalid_request', 400);
    return { resource, slug };
  }
  throw new ReadError('invalid_request', 400);
}
export async function readSocial(client: SupabaseClient<Database>, request: ReadRequest): Promise<ReadData> {
  if (request.resource === 'account') {
    const user = await requireUser(client);
    const [blocks, reports, media, profile, posts, deletion] = await Promise.all([
      client.from('blocks').select('blocked_id,blocked_name').eq('blocker_id',user.id).order('created_at',{ascending:false}).limit(500),
      client.from('reports').select('id,reason,status,created_at').eq('reporter_id',user.id).order('created_at',{ascending:false}).limit(20),
      client.from('media_assets').select('path,bucket,ready').eq('player_id',user.id).order('created_at',{ascending:false}).limit(50),
      client.from('profiles').select('avatar_path').eq('id',user.id).maybeSingle(),
      client.from('posts').select('image_path').eq('author_id',user.id).not('image_path','is',null).limit(50),
      client.from('account_deletions').select('player_id').eq('player_id',user.id).maybeSingle(),
    ]);
    if (blocks.error || reports.error || media.error || profile.error || posts.error || deletion.error) throw new ReadError('unavailable');
    const inUse = new Set([profile.data?.avatar_path,...(posts.data ?? []).map(p=>p.image_path)]);
    return { kind: 'account', viewerId: user.id, deletionPending: Boolean(deletion.data), blocks: blocks.data ?? [], reports: reports.data ?? [], media: (media.data ?? []).map(m=>({...m,inUse:inUse.has(m.path)})) };
  }
  if (request.resource === 'discover') {
    await requireUser(client);
    const { data, error } = await client.rpc('discover_players', { p_offset: request.offset, p_active: request.active, ...(request.sportId ? { p_sport_id: request.sportId } : {}), ...(request.arenaId ? { p_arena_id: request.arenaId } : {}), ...(request.level ? { p_level: request.level } : {}) });
    if (error || !data) throw new ReadError('unavailable');
    const rows = data.slice(0,24);
    const avatars = rows.length ? await client.from('profiles').select('id,avatar_path').in('id',rows.map(p=>p.id)) : { data: [], error: null };
    if (avatars.error) throw new ReadError('unavailable');
    return { kind: 'discover', players: rows.map(p=>({...p,avatar:mediaUrl('avatars',avatars.data?.find(a=>a.id===p.id)?.avatar_path ?? null)})), hasMore: data.length > 24 };
  }
  if (request.resource === 'player') {
    const user = await requireUser(client);
    const { data, error } = await getPublicProfile(client, request.username);
    if (error) throw new ReadError('unavailable');
    if (!data) throw new ReadError('not_found', 404);
    const connection = await client.from('connections').select('followed_id').eq('follower_id', user.id).eq('followed_id', data.id).maybeSingle();
    if (connection.error) throw new ReadError('unavailable');
    return { kind: 'player', profile: profileDto(data), own: user.id === data.id, connected: Boolean(connection.data) };
  }
  if (request.resource === 'feed') {
    const user = await requireUser(client);
    const { data, error } = await client.rpc('read_feed', { p_offset: request.offset, ...(request.arenaId ? { p_arena_id: request.arenaId } : {}) });
    if (error || !data) throw new ReadError('unavailable');
    const rows = data.slice(0,20);
    const media = rows.length ? await client.from('posts').select('id,image_path,profiles!posts_author_id_fkey(avatar_path)').in('id',rows.map(p=>p.id)) : { data: [], error: null };
    if (media.error) throw new ReadError('unavailable');
    return { kind: 'feed', posts: rows.map(p=>{ const m=media.data?.find(a=>a.id===p.id); return {...p,image:mediaUrl('post-media',m?.image_path ?? null),imagePath:m?.image_path ?? null,avatar:mediaUrl('avatars',m?.profiles?.avatar_path ?? null)}; }), hasMore: data.length > 20, viewerId: user.id };
  }
  if (request.resource === 'comments') {
    const user = await requireUser(client);
    const { data, error } = await client.from('comments').select('id, author_id, body, created_at, profiles(display_name, username)').eq('post_id', request.postId).order('created_at').order('id').range(request.offset, request.offset + 20);
    if (error || !data) throw new ReadError('unavailable');
    return { kind: 'comments', viewerId: user.id, hasMore: data.length > 20, comments: data.slice(0, 20).flatMap(row => row.profiles ? [{ id: row.id, authorId: row.author_id, body: row.body, createdAt: row.created_at, name: row.profiles.display_name, username: row.profiles.username }] : []) };
  }
  if (request.resource === 'checkin') {
    const user = await requireUser(client);
    const fields = 'id, player_id, expires_at, profiles(username, display_name), arena_sports(arenas(id, slug, name), sports(id, slug, name))' as const;
    const base = () => client.from('checkins').select(fields).is('ended_at', null).gt('expires_at', new Date().toISOString());
    let nearby = base().neq('player_id', user.id).order('started_at', { ascending: false }).order('id').limit(24);
    if (request.arenaId) nearby = nearby.eq('arena_id', request.arenaId);
    const [own, presence] = await Promise.all([base().eq('player_id', user.id).maybeSingle(), nearby]);
    if (own.error || presence.error || !presence.data) throw new ReadError('unavailable');
    const dto = (row: NonNullable<typeof own.data>): ReadPresence | null => row.profiles && row.arena_sports?.arenas && row.arena_sports.sports ? { id: row.id, playerId: row.player_id, name: row.profiles.display_name, username: row.profiles.username, arena: row.arena_sports.arenas, sport: row.arena_sports.sports, expiresAt: row.expires_at } : null;
    return { kind: 'checkin', own: own.data ? dto(own.data) : null, presence: presence.data.flatMap(row => { const value = dto(row); return value ? [value] : []; }) };
  }
  if (request.resource === 'sports') {
    const { data, error } = await listSports(client);
    if (error || !data) throw new ReadError('unavailable');
    return { kind: 'sports', sports: data };
  }
  if (request.resource === 'arenas') {
    const [arenas, sports] = await Promise.all([listPublicArenas(client, request.offset), listSports(client)]);
    if (arenas.error || sports.error || !arenas.data || !sports.data) throw new ReadError('unavailable');
    return { kind: 'arenas', arenas: arenas.data.slice(0, ARENA_PAGE_SIZE).map(arenaDto), sports: sports.data, hasMore: arenas.data.length > ARENA_PAGE_SIZE, offset: request.offset };
  }
  if (request.resource === 'arena') {
    const { data, error } = await getArenaBySlug(client, request.slug);
    if (error) throw new ReadError('unavailable');
    if (!data) throw new ReadError('not_found', 404);
    return { kind: 'arena', arena: arenaDto(data) };
  }
  const { data, error } = await getOwnProfile(client);
  if (error) throw new ReadError('unavailable');
  if (!data) throw new ReadError('profile_missing', 404);
  return { kind: 'profile', profile: profileDto(data) };
}
function profileDto(data: NonNullable<Awaited<ReturnType<typeof getOwnProfile>>['data']>): ReadProfile {
  return {
    id: data.id, username: data.username, name: data.display_name, bio: data.bio,
    city: data.city, neighborhood: data.neighborhood, available: data.available, avatar: mediaUrl('avatars',data.avatar_path), avatarPath: data.avatar_path,
    isDemo: data.is_demo, onboardingCompleted: data.onboarding_completed,
    sports: data.player_sports.flatMap(link => link.sports ? [{ sport: link.sports, level: link.level, isPrimary: link.is_primary }] : []),
  };
}

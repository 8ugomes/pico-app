import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { ReadArena, ReadData, ReadRequest, ReadPresence } from '../../types/read';
import { ARENA_PAGE_SIZE, getArenaBySlug, getOwnProfile, listPublicArenas, listSports, requireUser } from './queries.ts';
import { ReadError } from './read-errors.ts';

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
  if (resource === 'checkin') {
    const arenaId = params.get('arenaId') ?? undefined;
    if (arenaId && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(arenaId)) throw new ReadError('invalid_request', 400);
    return { resource, arenaId };
  }
  if (resource === 'sports') return { resource };
  if (resource === 'profile') return { resource };
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
  return { kind: 'profile', profile: {
    id: data.id, username: data.username, name: data.display_name, bio: data.bio,
    city: data.city, neighborhood: data.neighborhood, available: data.available,
    isDemo: data.is_demo, onboardingCompleted: data.onboarding_completed,
    sports: data.player_sports.flatMap(link => link.sports ? [{ sport: link.sports, level: link.level, isPrimary: link.is_primary }] : []),
  } };
}

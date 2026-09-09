import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { ReadArena, ReadData, ReadRequest } from '../../types/read';
import { ARENA_PAGE_SIZE, getArenaBySlug, getOwnProfile, listPublicArenas, listSports } from './queries.ts';
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

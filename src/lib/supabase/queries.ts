import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { ReadError } from './read-errors.ts';

const arenaFields = 'id, slug, name, description, neighborhood, city, image_path, is_demo, arena_sports(sports(id, slug, name))' as const;
const profileFields = 'id, username, display_name, bio, city, neighborhood, avatar_path, available, is_demo, onboarding_completed, player_sports(level, is_primary, sports(id, slug, name))' as const;
export const ARENA_PAGE_SIZE = 24;

export function listSports(client: SupabaseClient<Database>) {
  return client.from('sports').select('id, slug, name').order('name');
}
export function listPublicArenas(client: SupabaseClient<Database>, offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000) throw new ReadError('invalid_request', 400);
  return client.from('arenas').select(arenaFields).eq('is_public', true).order('name').order('id').range(offset, offset + ARENA_PAGE_SIZE);
}
export function getArenaBySlug(client: SupabaseClient<Database>, slug: string) {
  return client.from('arenas').select(arenaFields).eq('slug', slug).eq('is_public', true).maybeSingle();
}
export async function requireUser(client: SupabaseClient<Database>) {
  // Identity must come from Auth verification, never a query parameter or browser session object.
  const { data: identity, error } = await client.auth.getUser();
  if (error) {
    if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403) throw new ReadError('authentication', 401);
    throw new ReadError('unavailable');
  }
  if (!identity.user) throw new ReadError('authentication', 401);
  return identity.user;
}
export async function getOwnProfile(client: SupabaseClient<Database>) {
  const user = await requireUser(client);
  return client.from('profiles').select(profileFields).eq('id', user.id).maybeSingle();
}
// Preserved for the future feed integration; not invoked by Cycle 2 screens.
export function listArenaPosts(client: SupabaseClient<Database>, arenaId: string, offset = 0, limit = 20) {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new RangeError('Invalid pagination');
  return client.from('posts').select('id, author_id, arena_id, sport_id, body, image_path, created_at').eq('arena_id', arenaId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + limit - 1);
}
export function getPublicProfile(client: SupabaseClient<Database>, username: string) {
  return client.from('profiles').select(profileFields).eq('username', username).maybeSingle();
}

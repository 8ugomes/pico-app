import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { MutationError, mutationFailure } from './mutations.ts';
export const MEDIA_LIMIT = 3 * 1024 * 1024;
export type MediaBucket = 'avatars' | 'post-media' | 'entity-media';
export function mediaBucket(value: unknown): MediaBucket {
  if (value !== 'avatars' && value !== 'post-media' && value !== 'entity-media') throw new MutationError(400, 'Escolha uma foto de perfil ou publicação.');
  return value;
}
export function mediaPath(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(value)) throw new MutationError(400, 'Foto inválida.');
  return value;
}
export function mediaUrl(bucket: MediaBucket, path: string | null) {
  return path ? `/api/media?bucket=${bucket}&path=${encodeURIComponent(path)}` : null;
}
export async function removeUnusedMedia(client: SupabaseClient<Database>, admin: SupabaseClient<Database>, userId: string, bucket: MediaBucket, path: string) {
  const claimed = bucket === 'entity-media'
    ? await client.rpc('claim_entity_media', { p_path: path })
    : await client.rpc('claim_unused_media', { p_bucket: bucket, p_path: path });
  if (claimed.error) mutationFailure(claimed.error);
  const removed = await admin.storage.from(bucket).remove([path]);
  if (removed.error) throw new MutationError(503, 'Não foi possível remover a foto. Tente novamente.');
  const deleted = bucket === 'entity-media'
    ? await admin.from('entity_media_assets').delete().eq('path', path).eq('deleting', true)
    : await admin.from('media_assets').delete().eq('path', path).eq('player_id', userId).eq('deleting', true);
  if (deleted.error) mutationFailure(deleted.error);
}

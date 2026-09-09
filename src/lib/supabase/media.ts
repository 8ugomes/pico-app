import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { MutationError, mutationFailure } from './mutations.ts';
export const MEDIA_LIMIT = 3 * 1024 * 1024;
export type MediaBucket = 'avatars' | 'post-media';
export function mediaBucket(value: unknown): MediaBucket {
  if (value !== 'avatars' && value !== 'post-media') throw new MutationError(400, 'Escolha uma foto de perfil ou publicação.');
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
  const asset = await client.from('media_assets').select('path').eq('path', path).eq('bucket', bucket).eq('player_id', userId).maybeSingle();
  if (asset.error) mutationFailure(asset.error);
  if (!asset.data) throw new MutationError(404, 'Essa foto não está disponível na sua conta.');
  // Use administrative visibility so a future visibility policy cannot hide a
  // reference and accidentally permit removal of an in-use object.
  const reference = bucket === 'avatars'
    ? await admin.from('profiles').select('id').eq('avatar_path', path).limit(1)
    : await admin.from('posts').select('id').eq('image_path', path).limit(1);
  if (reference.error) mutationFailure(reference.error);
  if (reference.data?.length) throw new MutationError(409, 'Remova a foto do perfil ou exclua a publicação primeiro.');
  const removed = await admin.storage.from(bucket).remove([path]);
  if (removed.error) throw new MutationError(503, 'Não foi possível remover a foto. Tente novamente.');
  const deleted = await admin.from('media_assets').delete().eq('path', path).eq('player_id', userId);
  if (deleted.error) mutationFailure(deleted.error);
}

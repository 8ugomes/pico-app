import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/app-database';
import type { Level } from '../../types/social';
import { requireUser } from './queries.ts';

export class MutationError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const levels: Level[] = ['Iniciante', 'Intermediário', 'Avançado'];
export type Mutation = { action: 'save_profile'; name: string; username: string; bio: string; city: string; neighborhood: string; sportId: string; level: Level; available: boolean } | { action: 'set_connection'; playerId: string; connected: boolean } | { action: 'create_post'; arenaId: string; sportId: string; body: string; imagePath?: string | null } | { action: 'set_like'; postId: string; liked: boolean } | { action: 'create_comment'; postId: string; body: string }
  | { action: 'set_avatar'; path: string | null }
  | { action: 'delete_post'; id: string } | { action: 'delete_comment'; id: string }
  | { action: 'set_block'; playerId: string; blocked: boolean }
  | { action: 'report'; target: 'player' | 'post' | 'comment'; id: string; reason: 'spam' | 'harassment' | 'unsafe' | 'other'; details: string };
export function invalid(): never { throw new MutationError(400, 'Confira os campos e tente novamente.'); }
export function textField(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') return invalid();
  const result = value.trim();
  if (result.length < min || result.length > max) return invalid();
  return result;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) return invalid();
  return value;
}
export function exactKeys(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) invalid();
}
export function parseMutation(value: unknown): Mutation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const body = value as Record<string, unknown>;
  if (body.action === 'set_avatar') {
    exactKeys(body, ['action','path']);
    if (body.path !== null && (typeof body.path !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(body.path))) return invalid();
    return { action: body.action, path: body.path as string | null };
  }
  if (body.action === 'delete_post' || body.action === 'delete_comment') {
    exactKeys(body, ['action','id']); return { action: body.action, id: uuid(body.id) };
  }
  if (body.action === 'set_block') {
    exactKeys(body, ['action','playerId','blocked']);
    if (typeof body.blocked !== 'boolean') return invalid();
    return { action: body.action, playerId: uuid(body.playerId), blocked: body.blocked };
  }
  if (body.action === 'report') {
    exactKeys(body, ['action','target','id','reason','details']);
    if (!['player','post','comment'].includes(String(body.target)) || !['spam','harassment','unsafe','other'].includes(String(body.reason))) return invalid();
    return { action: body.action, target: body.target as 'player' | 'post' | 'comment', id: uuid(body.id), reason: body.reason as 'spam' | 'harassment' | 'unsafe' | 'other', details: textField(body.details,0,500) };
  }
  if (body.action === 'set_connection') {
    exactKeys(body, ['action', 'playerId', 'connected']);
    if (typeof body.connected !== 'boolean') return invalid();
    return { action: body.action, playerId: uuid(body.playerId), connected: body.connected };
  }
  if (body.action === 'create_post') {
    exactKeys(body, ['action', 'arenaId', 'sportId', 'body', 'imagePath']);
    if (body.imagePath != null && (typeof body.imagePath !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(body.imagePath))) return invalid();
    return { action: body.action, arenaId: uuid(body.arenaId), sportId: uuid(body.sportId), body: textField(body.body, 1, 500), ...(body.imagePath !== undefined ? { imagePath: body.imagePath as string | null } : {}) };
  }
  if (body.action === 'set_like') {
    exactKeys(body, ['action', 'postId', 'liked']);
    if (typeof body.liked !== 'boolean') return invalid();
    return { action: body.action, postId: uuid(body.postId), liked: body.liked };
  }
  if (body.action === 'create_comment') {
    exactKeys(body, ['action', 'postId', 'body']);
    return { action: body.action, postId: uuid(body.postId), body: textField(body.body, 1, 280) };
  }
  if (body.action === 'save_profile') {
    exactKeys(body, ['action', 'name', 'username', 'bio', 'city', 'neighborhood', 'sportId', 'level', 'available']);
    const username = textField(body.username, 3, 40).toLowerCase();
    if (!/^[a-z0-9_]+$/.test(username) || !levels.includes(body.level as Level) || typeof body.available !== 'boolean') return invalid();
    return { action: body.action, name: textField(body.name, 2, 60), username, bio: textField(body.bio, 0, 160), city: textField(body.city, 0, 80), neighborhood: textField(body.neighborhood, 0, 80), sportId: uuid(body.sportId), level: body.level as Level, available: body.available };
  }
  return invalid();
}
export function mutationFailure(error: { code?: string }) {
  if (error.code === 'P0409') throw new MutationError(409, 'Estas informações mudaram. Atualize antes de tentar novamente.');
  if (error.code === 'P0429') throw new MutationError(429, 'Você chegou ao limite por agora. Aguarde antes de tentar novamente; para fotos, remova as que não usa em Privacidade e conta.');
  if (error.code === '23505') throw new MutationError(409, 'Esse nome de usuário já está em uso. Escolha outro.');
  if (['23503', '23514', '22P02', '23502'].includes(error.code ?? '')) throw new MutationError(400, 'Confira os campos. O conteúdo escolhido pode não estar mais disponível.');
  if (error.code === '42501') throw new MutationError(403, 'Você não tem acesso a essa ação. Entre novamente e confira o conteúdo.');
  throw new MutationError(503, 'Não foi possível confirmar a alteração. Atualize para conferir antes de tentar de novo.');
}
export async function mutateSocial(client: SupabaseClient<Database>, input: Mutation) {
  const user = await requireUser(client);
  if (input.action === 'set_avatar') {
    const { data, error } = await client.from('profiles').update({ avatar_path: input.path }).eq('id',user.id).select('id');
    if (error) mutationFailure(error);
    if (!data?.length) throw new MutationError(404,'Perfil indisponível.');
    return;
  }
  if (input.action === 'delete_post' || input.action === 'delete_comment') {
    const { data, error } = await client.from(input.action === 'delete_post' ? 'posts' : 'comments').delete().eq('id',input.id).eq('author_id',user.id).select('id');
    if (error) mutationFailure(error);
    if (!data?.length) throw new MutationError(404,'Esse conteúdo não está disponível na sua conta.');
    return;
  }
  if (input.action === 'set_block') {
    if (input.playerId === user.id) throw new MutationError(400,'Escolha outro jogador.');
    const { error } = input.blocked ? await client.from('blocks').insert({ blocked_id: input.playerId }) : await client.from('blocks').delete().eq('blocker_id',user.id).eq('blocked_id',input.playerId);
    if (error && !(input.blocked && error.code === '23505')) mutationFailure(error);
    return;
  }
  if (input.action === 'report') {
    const { error } = await client.from('reports').insert({ reason: input.reason, details: input.details,
      ...(input.target === 'player' ? { player_id: input.id } : input.target === 'post' ? { post_id: input.id } : { comment_id: input.id }) });
    if (error?.code === '23505') throw new MutationError(409,'Você já denunciou esse conteúdo. A denúncia está registrada.');
    if (error) mutationFailure(error);
    return;
  }
  if (input.action === 'set_connection') {
    if (input.playerId === user.id) throw new MutationError(400, 'Você já faz parte do seu próprio Pico. Escolha outro jogador.');
    const { error } = input.connected ? await client.from('connections').insert({ followed_id: input.playerId }) : await client.from('connections').delete().eq('follower_id', user.id).eq('followed_id', input.playerId);
    if (error && !(input.connected && error.code === '23505')) mutationFailure(error); return;
  }
  if (input.action === 'create_post') {
    const { error } = await client.from('posts').insert({ arena_id: input.arenaId, sport_id: input.sportId, body: input.body, ...(input.imagePath ? { image_path: input.imagePath } : {}) });
    if (error) mutationFailure(error); return;
  }
  if (input.action === 'set_like') {
    const { error } = input.liked ? await client.from('post_likes').insert({ post_id: input.postId }) : await client.from('post_likes').delete().eq('post_id', input.postId).eq('player_id', user.id);
    if (error && !(input.liked && error.code === '23505')) mutationFailure(error); return;
  }
  if (input.action === 'create_comment') {
    const { error } = await client.from('comments').insert({ post_id: input.postId, body: input.body });
    if (error) mutationFailure(error); return;
  }
  const { data: profile, error: profileError } = await client.from('profiles').select('avatar_path').eq('id', user.id).maybeSingle();
  if (profileError) mutationFailure(profileError);
  if (!profile?.avatar_path) throw new MutationError(400, 'Escolha e confirme sua foto antes de salvar o perfil.');
  const { error } = await client.rpc('save_profile', {
    p_name: input.name, p_username: input.username, p_bio: input.bio, p_city: input.city,
    p_neighborhood: input.neighborhood, p_sport_id: input.sportId, p_level: input.level, p_available: input.available,
  });
  if (error) mutationFailure(error);
}

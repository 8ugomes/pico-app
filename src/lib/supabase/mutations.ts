import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { Level } from '../../types/social';
import { requireUser } from './queries.ts';

export class MutationError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const levels: Level[] = ['Iniciante', 'Intermediário', 'Avançado'];
export type Mutation = { action: 'save_profile'; name: string; username: string; bio: string; city: string; neighborhood: string; sportId: string; level: Level; available: boolean } | { action: 'start_checkin'; arenaId: string; sportId: string } | { action: 'end_checkin' };
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
  if (body.action === 'start_checkin') {
    exactKeys(body, ['action', 'arenaId', 'sportId']);
    return { action: body.action, arenaId: uuid(body.arenaId), sportId: uuid(body.sportId) };
  }
  if (body.action === 'end_checkin') { exactKeys(body, ['action']); return { action: body.action }; }
  if (body.action === 'save_profile') {
    exactKeys(body, ['action', 'name', 'username', 'bio', 'city', 'neighborhood', 'sportId', 'level', 'available']);
    const username = textField(body.username, 3, 40).toLowerCase();
    if (!/^[a-z0-9_]+$/.test(username) || !levels.includes(body.level as Level) || typeof body.available !== 'boolean') return invalid();
    return { action: body.action, name: textField(body.name, 2, 60), username, bio: textField(body.bio, 0, 160), city: textField(body.city, 0, 80), neighborhood: textField(body.neighborhood, 0, 80), sportId: uuid(body.sportId), level: body.level as Level, available: body.available };
  }
  return invalid();
}
export function mutationFailure(error: { code?: string }) {
  if (error.code === '23505') throw new MutationError(409, 'Esse nome de usuário já está em uso. Escolha outro.');
  if (['23503', '23514', '22P02', '23502'].includes(error.code ?? '')) throw new MutationError(400, 'Confira os campos. O conteúdo escolhido pode não estar mais disponível.');
  if (error.code === '42501') throw new MutationError(403, 'Você não tem acesso a essa ação. Entre novamente e confira o conteúdo.');
  throw new MutationError(503, 'Não foi possível confirmar a alteração. Atualize para conferir antes de tentar de novo.');
}
export async function mutateSocial(client: SupabaseClient<Database>, input: Mutation) {
  await requireUser(client);
  if (input.action === 'start_checkin') {
    const { error } = await client.rpc('start_checkin', { arena_id: input.arenaId, sport_id: input.sportId });
    if (error) mutationFailure(error); return;
  }
  if (input.action === 'end_checkin') {
    const { error } = await client.rpc('end_checkin', {});
    if (error) mutationFailure(error); return;
  }
  const { error } = await client.rpc('save_profile', {
    p_name: input.name, p_username: input.username, p_bio: input.bio, p_city: input.city,
    p_neighborhood: input.neighborhood, p_sport_id: input.sportId, p_level: input.level, p_available: input.available,
  });
  if (error) mutationFailure(error);
}

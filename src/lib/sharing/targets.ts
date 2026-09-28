import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/app-database';
import { MutationError, exactKeys, textField, uuid } from '../supabase/mutations.ts';

export type ShareTarget =
  | { kind: 'profile'; username: string }
  | { kind: 'arena'; slug: string }
  | { kind: 'community'; slug: string }
  | { kind: 'post'; id: string };

export type ShareDescriptor = {
  kind: ShareTarget['kind'];
  path: string;
  title: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const usernamePattern = /^[a-z0-9_]{3,40}$/;

function slug(value: unknown) {
  const result = textField(value, 1, 80).toLowerCase();
  if (!slugPattern.test(result)) throw new MutationError(400, 'Destino inválido.');
  return result;
}

export function parseShareTarget(value: unknown): ShareTarget {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new MutationError(400, 'Destino inválido.');
  const body = value as Record<string, unknown>;
  if (body.kind === 'profile') {
    exactKeys(body, ['kind', 'username']);
    const username = textField(body.username, 3, 40).toLowerCase();
    if (!usernamePattern.test(username)) throw new MutationError(400, 'Destino inválido.');
    return { kind: body.kind, username };
  }
  if (body.kind === 'arena' || body.kind === 'community') {
    exactKeys(body, ['kind', 'slug']);
    return { kind: body.kind, slug: slug(body.slug) };
  }
  if (body.kind === 'post') {
    exactKeys(body, ['kind', 'id']);
    return { kind: body.kind, id: uuid(body.id) };
  }
  throw new MutationError(400, 'Destino inválido.');
}

export function configuredPublicOrigin(value = process.env.PICO_PUBLIC_ORIGIN) {
  if (!value) throw new MutationError(503, 'O domínio público do Pico ainda não foi configurado.');
  let url: URL;
  try { url = new URL(value); } catch { throw new MutationError(503, 'O domínio público do Pico está inválido.'); }
  const localDevelopment = process.env.NODE_ENV !== 'production'
    && url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((!localDevelopment && url.protocol !== 'https:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new MutationError(503, 'O domínio público do Pico está inválido.');
  }
  return url.origin;
}

export function shareUrl(origin: string, descriptor: ShareDescriptor) {
  return new URL(descriptor.path, `${origin}/`).toString();
}

export function privilegedInvitationLink(origin: string, path: '/acesso' | '/convite/arena' | '/convite/comunidade', value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new MutationError(503, 'Não foi possível preparar o convite.');
  const result = value as Record<string, unknown>;
  if (typeof result.id !== 'string' || typeof result.token !== 'string' || !/^[a-f0-9]{64}$/.test(result.token)) {
    throw new MutationError(503, 'Não foi possível preparar o convite.');
  }
  const url = new URL(path, `${origin}/`);
  url.hash = result.token;
  return { id: result.id, username: typeof result.username === 'string' ? result.username : undefined, url: url.toString() };
}

export function scopeInvitationLink(origin: string, kind: 'arena' | 'community', value: unknown) {
  return privilegedInvitationLink(origin, kind === 'arena' ? '/convite/arena' : '/convite/comunidade', value);
}

export async function resolveShareDescriptor(client: SupabaseClient<Database>, userId: string, target: ShareTarget): Promise<ShareDescriptor> {
  if (target.kind === 'profile') {
    const result = await client.from('profiles').select('id,username,display_name,is_demo,onboarding_completed').eq('id', userId).eq('username', target.username).maybeSingle();
    if (result.error) throw new MutationError(503, 'Não foi possível conferir o perfil agora.');
    if (!result.data || result.data.is_demo || !result.data.onboarding_completed) throw new MutationError(403, 'Este perfil não pode ser compartilhado.');
    return { kind: target.kind, path: `/perfil/${result.data.username}`, title: `${result.data.display_name} no Pico` };
  }
  if (target.kind === 'arena') {
    const result = await client.from('arenas').select('id,slug,name,is_public,is_demo,status').eq('slug', target.slug).maybeSingle();
    if (result.error) throw new MutationError(503, 'Não foi possível conferir a arena agora.');
    if (!result.data || !result.data.is_public || result.data.is_demo || result.data.status !== 'active') throw new MutationError(403, 'Esta arena não pode ser compartilhada.');
    return { kind: target.kind, path: `/arenas/${result.data.slug}`, title: `${result.data.name} no Pico` };
  }
  if (target.kind === 'community') {
    const result = await client.from('communities').select('id,slug,name,visibility,entry_mode,status').eq('slug', target.slug).maybeSingle();
    if (result.error) throw new MutationError(503, 'Não foi possível conferir a comunidade agora.');
    if (!result.data || result.data.visibility !== 'beta' || !['open', 'approval'].includes(result.data.entry_mode) || result.data.status !== 'active') {
      throw new MutationError(403, 'Esta comunidade não pode ser compartilhada.');
    }
    return { kind: target.kind, path: `/comunidades/${result.data.slug}`, title: `${result.data.name} no Pico` };
  }
  const result = await client.from('posts').select('id,author_id,arena_id,audience,moderated_at').eq('id', target.id).maybeSingle();
  if (result.error) throw new MutationError(503, 'Não foi possível conferir a publicação agora.');
  if (!result.data || result.data.audience !== 'beta' || result.data.moderated_at) throw new MutationError(403, 'Esta publicação não pode ser compartilhada.');
  const author = await client.from('profiles').select('is_demo').eq('id', result.data.author_id).maybeSingle();
  if (author.error) throw new MutationError(503, 'Não foi possível conferir a publicação agora.');
  if (!author.data || author.data.is_demo) throw new MutationError(403, 'Esta publicação não pode ser compartilhada.');
  const destinations = await client.from('post_destinations').select('arena_id').eq('post_id', result.data.id).not('arena_id', 'is', null);
  if (destinations.error) throw new MutationError(503, 'Não foi possível conferir a publicação agora.');
  const arenaIds = [...new Set([result.data.arena_id, ...(destinations.data ?? []).map(item => item.arena_id)].filter((id): id is string => Boolean(id)))];
  if (arenaIds.length) {
    const arenas = await client.from('arenas').select('id,is_demo,is_public,status').in('id', arenaIds);
    if (arenas.error) throw new MutationError(503, 'Não foi possível conferir a publicação agora.');
    if ((arenas.data?.length ?? 0) !== arenaIds.length || arenas.data?.some(arena => arena.is_demo || !arena.is_public || arena.status !== 'active')) {
      throw new MutationError(403, 'Esta publicação não pode ser compartilhada.');
    }
  }
  return { kind: target.kind, path: `/publicacoes/${result.data.id}`, title: 'Publicação no Pico' };
}

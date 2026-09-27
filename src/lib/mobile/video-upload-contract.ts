import { getSupabaseEnvironment } from '../supabase/config.ts';
import { MutationError } from '../supabase/mutations.ts';
import { POST_VIDEO_LIMIT, postVideoPath } from '../supabase/post-video.ts';

export { POST_VIDEO_LIMIT };

export const MOBILE_VIDEO_MINIMUM_SIZE = 32;
export const MOBILE_VIDEO_BUCKET = 'post-videos';
export const MOBILE_VIDEO_TUS_PATH = '/storage/v1/upload/resumable/sign';

export type MobileVideoUploadMutation =
  | { action: 'reserve'; size: number; path?: string }
  | { action: 'finalize'; size: number; path: string }
  | { action: 'delete'; path: string };

function invalid(message = 'Confira os dados do vídeo e tente novamente.'): never {
  throw new MutationError(400, message);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalid();
}

function videoSize(value: unknown) {
  if (
    typeof value !== 'number'
    || !Number.isSafeInteger(value)
    || value < MOBILE_VIDEO_MINIMUM_SIZE
    || value > POST_VIDEO_LIMIT
  ) {
    throw new MutationError(413, 'Escolha um vídeo MP4 de até 45 MB.');
  }
  return value;
}

export function parseMobileVideoUploadMutation(value: unknown): MobileVideoUploadMutation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const body = value as Record<string, unknown>;

  if (body.action === 'reserve') {
    exactKeys(body, ['action', 'size', 'path']);
    const size = videoSize(body.size);
    return body.path === undefined
      ? { action: 'reserve', size }
      : { action: 'reserve', size, path: postVideoPath(body.path) };
  }
  if (body.action === 'finalize') {
    exactKeys(body, ['action', 'size', 'path']);
    return { action: 'finalize', size: videoSize(body.size), path: postVideoPath(body.path) };
  }
  if (body.action === 'delete') {
    exactKeys(body, ['action', 'path']);
    return { action: 'delete', path: postVideoPath(body.path) };
  }
  return invalid();
}

function base64UrlPayload(segment: string) {
  const normalized = segment.replaceAll('-', '+').replaceAll('_', '/');
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
}

export function isSupabasePublishableKey(value: unknown): value is string {
  if (typeof value !== 'string' || !value || /\s/.test(value) || value.startsWith('sb_secret_')) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  const segments = value.split('.');
  if (segments.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(base64UrlPayload(segments[1]))) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

export function resolveMobileVideoUploadTarget(url: string, key: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('A origem de Storage do vídeo está inválida.');
  }
  const project = /^([a-z0-9][a-z0-9-]{2,62})\.supabase\.co$/.exec(parsed.hostname)?.[1];
  if (
    parsed.protocol !== 'https:'
    || !project
    || parsed.port
    || parsed.username
    || parsed.password
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
  ) {
    throw new Error('A origem de Storage do vídeo está inválida.');
  }
  if (!isSupabasePublishableKey(key)) {
    throw new Error('A chave pública de Storage está inválida.');
  }
  return {
    endpoint: `https://${project}.storage.supabase.co${MOBILE_VIDEO_TUS_PATH}`,
    publishableKey: key,
  };
}

export function configuredMobileVideoUploadTarget() {
  const environment = getSupabaseEnvironment();
  if (environment.status !== 'configured') {
    throw new MutationError(503, 'O envio de vídeo está indisponível agora.');
  }
  return resolveMobileVideoUploadTarget(environment.url, environment.key);
}

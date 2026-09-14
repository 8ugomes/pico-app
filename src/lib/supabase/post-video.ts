import { MutationError } from './mutations';

export const POST_VIDEO_LIMIT = 45 * 1024 * 1024;
export const VIDEO_CHUNK_SIZE = 1024 * 1024;

export function postVideoPath(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.mp4$/.test(value))
    throw new MutationError(400, 'Vídeo inválido.');
  return value;
}

export function postVideoSize(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > POST_VIDEO_LIMIT)
    throw new MutationError(413, 'Escolha um vídeo MP4 de até 45 MB.');
  return value;
}

export function videoRange(value: string | null, size: number): { start: number; end: number } {
  const match = value?.match(/^bytes=(\d*)-(\d*)$/);
  if (value && !match) throw new MutationError(416, 'Trecho de vídeo inválido.');
  if (match && !match[1] && !match[2]) throw new MutationError(416, 'Trecho de vídeo inválido.');
  if (match && !match[1]) {
    const length = Number(match[2]);
    if (!Number.isSafeInteger(length) || length < 1) throw new MutationError(416, 'Trecho de vídeo inválido.');
    return { start: Math.max(0, size - Math.min(length, VIDEO_CHUNK_SIZE)), end: size - 1 };
  }
  const start = match ? Number(match[1]) : 0;
  const requestedEnd = match?.[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start >= size || requestedEnd < start)
    throw new MutationError(416, 'Trecho de vídeo inválido.');
  return { start, end: Math.min(requestedEnd, start + VIDEO_CHUNK_SIZE - 1, size - 1) };
}

export function isMp4Header(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
}

export function postVideoUrl(path: string | null): string | null {
  return path ? `/api/post-video?path=${encodeURIComponent(path)}` : null;
}

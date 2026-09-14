import 'server-only';
import { createAdminClient } from './admin';
import { MutationError } from './mutations';
import { privateHeaders } from './api';

export async function signedVideoRange(path: string, start: number, end: number, size: number) {
  const signed = await createAdminClient().storage.from('post-videos').createSignedUrl(path, 30);
  if (signed.error || !signed.data) throw new MutationError(503, 'Vídeo indisponível agora.');
  const response = await fetch(signed.data.signedUrl, {
    headers: { Range: `bytes=${start}-${end}` }, cache: 'no-store', signal: AbortSignal.timeout(20000),
  });
  if (response.status !== 206 || response.headers.get('content-range') !== `bytes ${start}-${end}/${size}`) {
    await response.body?.cancel();
    throw new MutationError(503, 'Não foi possível carregar o vídeo agora.');
  }
  return response;
}

export function videoResponse(source: Response, start: number, end: number, size: number) {
  return new Response(source.body, { status: 206, headers: {
    ...privateHeaders, 'Content-Type': 'video/mp4', 'Content-Disposition': 'inline; filename="pico.mp4"',
    'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes', 'Cross-Origin-Resource-Policy': 'same-origin',
  } });
}

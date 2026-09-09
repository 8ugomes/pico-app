import { operationFailure } from '../operations';
import { MutationError } from './mutations';
import { ReadError } from './read-errors';
export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' };
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new MutationError(403, 'Abra o Pico novamente para continuar.');
}
export async function limitedBody(request: Request, limit = 8192) {
  const reader = request.body?.getReader();
  if (!reader) throw new MutationError(400, 'Envio inválido.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > limit) { await reader.cancel(); throw new MutationError(413, 'O arquivo ou conteúdo é muito grande.'); }
    chunks.push(chunk.value);
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new MutationError(415, 'Envio inválido.');
  try {
    const body: unknown = JSON.parse((await limitedBody(request)).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof MutationError) throw error;
    throw new MutationError(400, 'Envio inválido.');
  }
}
export function apiError(error: unknown) {
  const known = error instanceof MutationError || error instanceof ReadError;
  operationFailure(known ? error.status : 503, known);
  return Response.json({ status: 'error', message: known ? error.message : 'Não foi possível concluir agora. Atualize para conferir antes de tentar novamente.' }, { status: known ? error.status : 503, headers: privateHeaders });
}

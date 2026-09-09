import { createClient } from '@/lib/supabase/server';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { MutationError, mutateSocial, parseMutation } from '@/lib/supabase/mutations';
import { ReadError } from '@/lib/supabase/read-errors';
import { requireUser } from '@/lib/supabase/queries';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeUnusedMedia } from '@/lib/supabase/media';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' };
export async function POST(request: Request) {
  try {
    // Cookie-authenticated writes only accept JSON from this origin.
    if (request.headers.get('origin') !== new URL(request.url).origin) throw new MutationError(403, 'Abra o Pico novamente para continuar.');
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new MutationError(415, 'Envio inválido.');
    const reader = request.body?.getReader();
    if (!reader) throw new MutationError(400, 'Envio inválido.');
    let size = 0;
    let body = '';
    const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new MutationError(413, 'O conteúdo é muito grande.'); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    let value: unknown;
    try { value = JSON.parse(body); } catch { throw new MutationError(400, 'Envio inválido.'); }
    const input = parseMutation(value);
    if (getSupabaseEnvironment().status !== 'configured') throw new MutationError(503, 'O acesso às contas não está disponível agora.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Não foi possível conectar agora.');
    let photo: string | null = null;
    let ownerId: string | null = null;
    if (input.action === 'delete_post') {
      const user = await requireUser(client); ownerId = user.id;
      const post = await client.from('posts').select('image_path').eq('id',input.id).eq('author_id',user.id).maybeSingle();
      if (post.error) throw new MutationError(503,'Não foi possível conferir a publicação.');
      photo = post.data?.image_path ?? null;
      if (photo) createAdminClient(); // Verify server configuration before deletion.
    }
    await mutateSocial(client, input);
    if (photo && ownerId) {
      try { await removeUnusedMedia(client,createAdminClient(),ownerId,'post-media',photo); }
      catch { throw new MutationError(503,'A publicação foi excluída. Remova a foto pendente em Privacidade e conta.'); }
    }
    return Response.json({ status: 'success' }, { headers });
  } catch (error) {
    const known = error instanceof MutationError || error instanceof ReadError;
    return Response.json({ status: 'error', message: known ? error.message : 'Não foi possível confirmar a alteração. Atualize para conferir antes de tentar de novo.' }, { status: known ? error.status : 503, headers });
  }
}

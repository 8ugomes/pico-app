import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/queries';
import { MutationError, exactKeys, mutationFailure } from '@/lib/supabase/mutations';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { isMp4Header, postVideoPath, postVideoSize, videoRange } from '@/lib/supabase/post-video';
import { signedVideoRange, videoResponse } from '@/lib/supabase/post-video-stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const bucket = 'post-videos';

async function actor() {
  const client = await createClient();
  if (!client) throw new MutationError(503, 'O acesso aos vídeos está indisponível agora.');
  const user = await requireUser(client);
  return { client, user };
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = await jsonBody(request);
    exactKeys(input, ['action','size','path']);
    const { client, user } = await actor();
    const admin = createAdminClient();
    if (input.action === 'reserve') {
      postVideoSize(input.size);
      const reserved = await client.rpc('reserve_post_video');
      if (reserved.error) mutationFailure(reserved.error);
      const path = reserved.data!;
      const signed = await admin.storage.from(bucket).createSignedUploadUrl(path);
      if (signed.error || !signed.data) {
        await admin.from('post_video_assets').delete().eq('path', path).eq('player_id', user.id).eq('ready', false);
        throw new MutationError(503, 'Não foi possível preparar o envio. Tente novamente.');
      }
      return Response.json({ data: { path, token: signed.data.token } }, { headers: privateHeaders });
    }
    if (input.action === 'finalize') {
      exactKeys(input, ['action','size','path']);
      const path = postVideoPath(input.path), size = postVideoSize(input.size);
      const owned = await client.from('post_video_assets').select('ready,byte_size,deleting').eq('path', path).eq('player_id', user.id).maybeSingle();
      if (owned.error) mutationFailure(owned.error);
      if (!owned.data || owned.data.deleting) throw new MutationError(404, 'Envio de vídeo indisponível.');
      if (owned.data.ready) {
        if (owned.data.byte_size !== size) throw new MutationError(409, 'O vídeo enviado mudou. Escolha o arquivo novamente.');
        return Response.json({ data: { path } }, { headers: privateHeaders });
      }
      const info = await admin.storage.from(bucket).info(path);
      if (info.error || !info.data) throw new MutationError(503, 'Envio ainda não confirmado. Tente novamente.');
      if (info.data.size !== size || info.data.contentType !== 'video/mp4') throw new MutationError(415, 'O arquivo enviado não é um MP4 válido de até 30 MB.');
      if (size < 32) throw new MutationError(415, 'O arquivo enviado não é um MP4 válido.');
      const first = await signedVideoRange(path, 0, 31, size);
      const header = new Uint8Array(await first.arrayBuffer());
      if (!isMp4Header(header)) throw new MutationError(415, 'O arquivo enviado não é um MP4 válido.');
      const ready = await admin.from('post_video_assets').update({ ready: true, byte_size: size })
        .eq('path', path).eq('player_id', user.id).eq('ready', false).eq('deleting', false).select('path').single();
      if (ready.error) mutationFailure(ready.error);
      return Response.json({ data: { path } }, { headers: privateHeaders });
    }
    throw new MutationError(400, 'Ação inválida.');
  } catch (error) { return apiError(error); }
}

export async function GET(request: Request) {
  try {
    const { client } = await actor();
    const path = postVideoPath(new URL(request.url).searchParams.get('path'));
    const allowed = await client.rpc('can_read_post_video', { p_path: path });
    if (allowed.error) mutationFailure(allowed.error);
    if (!allowed.data) throw new MutationError(404, 'Vídeo indisponível.');
    const asset = await createAdminClient().from('post_video_assets').select('byte_size').eq('path', path).eq('ready', true).eq('deleting', false).maybeSingle();
    if (asset.error || !asset.data?.byte_size) throw new MutationError(404, 'Vídeo indisponível.');
    const size = asset.data.byte_size;
    const { start, end } = videoRange(request.headers.get('range'), size);
    const source = await signedVideoRange(path, start, end, size);
    return videoResponse(source, start, end, size);
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const input = await jsonBody(request); exactKeys(input, ['path']);
    const path = postVideoPath(input.path);
    const { client, user } = await actor();
    const claimed = await client.rpc('claim_unused_post_video', { p_path: path });
    if (claimed.error) mutationFailure(claimed.error);
    const admin = createAdminClient();
    const removed = await admin.storage.from(bucket).remove([path]);
    if (removed.error) throw new MutationError(503, 'Não foi possível remover o vídeo. Tente novamente.');
    const deleted = await admin.from('post_video_assets').delete().eq('path', path).eq('player_id', user.id).eq('deleting', true);
    if (deleted.error) mutationFailure(deleted.error);
    return Response.json({ status: 'success' }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

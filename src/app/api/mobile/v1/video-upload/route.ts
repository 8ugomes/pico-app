import {
  MOBILE_API_VERSION,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { MOBILE_VIDEO_PUBLISHING_ENABLED } from '@/lib/mobile/features';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import {
  MOBILE_VIDEO_BUCKET,
  configuredMobileVideoUploadTarget,
  parseMobileVideoUploadMutation,
} from '@/lib/mobile/video-upload-contract';
import { createAdminClient } from '@/lib/supabase/admin';
import { isMp4Header } from '@/lib/supabase/post-video';
import { signedVideoRange } from '@/lib/supabase/post-video-stream';
import { MutationError, mutationFailure } from '@/lib/supabase/mutations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function actor(request: Request) {
  const { accessToken } = validateMobileRequest(request);
  const client = createMobileDataClient(accessToken!);
  const user = await requireMobileUser(client, accessToken!);
  return { client, user };
}

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function POST(request: Request) {
  let newReservation: { path: string; ownerId: string } | null = null;
  try {
    const { client, user } = await actor(request);
    if (!MOBILE_VIDEO_PUBLISHING_ENABLED) {
      throw new MutationError(409, 'O envio de vídeo ainda não está disponível nesta versão do iPhone.');
    }
    const input = parseMobileVideoUploadMutation(await readMobileJson(request));
    if (input.action === 'delete') throw new MutationError(405, 'Use a remoção do app para descartar este vídeo.');
    const admin = createAdminClient();

    if (input.action === 'reserve') {
      let path = input.path;
      if (path) {
        const owned = await client
          .from('post_video_assets')
          .select('ready,deleting')
          .eq('path', path)
          .eq('player_id', user.id)
          .maybeSingle();
        if (owned.error) mutationFailure(owned.error);
        if (!owned.data || owned.data.deleting) throw new MutationError(404, 'Envio de vídeo indisponível.');
        if (owned.data.ready) throw new MutationError(409, 'Esse vídeo já foi enviado. Confira a publicação antes de tentar novamente.');
      } else {
        const reserved = await client.rpc('reserve_post_video');
        if (reserved.error) mutationFailure(reserved.error);
        path = reserved.data!;
        newReservation = { path, ownerId: user.id };
      }

      const signed = await admin.storage.from(MOBILE_VIDEO_BUCKET).createSignedUploadUrl(path);
      if (signed.error || !signed.data?.token) {
        throw new MutationError(503, 'Não foi possível preparar o envio. Tente novamente.');
      }
      const target = configuredMobileVideoUploadTarget();
      return mobileJson(
        request,
        {
          data: {
            path,
            token: signed.data.token,
            endpoint: target.endpoint,
            publishableKey: target.publishableKey,
          },
          apiVersion: MOBILE_API_VERSION,
        },
        { status: input.path ? 200 : 201 },
      );
    }

    const { path, size } = input;
    const owned = await client
      .from('post_video_assets')
      .select('ready,byte_size,deleting')
      .eq('path', path)
      .eq('player_id', user.id)
      .maybeSingle();
    if (owned.error) mutationFailure(owned.error);
    if (!owned.data || owned.data.deleting) throw new MutationError(404, 'Envio de vídeo indisponível.');
    if (owned.data.ready) {
      if (owned.data.byte_size !== size) throw new MutationError(409, 'O vídeo enviado mudou. Escolha o arquivo novamente.');
      return mobileJson(request, { data: { path }, apiVersion: MOBILE_API_VERSION });
    }

    const info = await admin.storage.from(MOBILE_VIDEO_BUCKET).info(path);
    if (info.error || !info.data) throw new MutationError(503, 'Envio ainda não confirmado. Tente novamente.');
    if (info.data.size !== size || info.data.contentType !== 'video/mp4') {
      throw new MutationError(415, 'O arquivo enviado não é um MP4 válido de até 45 MB.');
    }
    const first = await signedVideoRange(path, 0, 31, size);
    const header = new Uint8Array(await first.arrayBuffer());
    if (!isMp4Header(header)) throw new MutationError(415, 'O arquivo enviado não é um MP4 válido.');

    const ready = await admin
      .from('post_video_assets')
      .update({ ready: true, byte_size: size })
      .eq('path', path)
      .eq('player_id', user.id)
      .eq('ready', false)
      .eq('deleting', false)
      .select('path')
      .single();
    if (ready.error) mutationFailure(ready.error);
    return mobileJson(request, { data: { path }, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    if (newReservation) {
      try {
        const admin = createAdminClient();
        await admin.storage.from(MOBILE_VIDEO_BUCKET).remove([newReservation.path]);
        await admin
          .from('post_video_assets')
          .delete()
          .eq('path', newReservation.path)
          .eq('player_id', newReservation.ownerId)
          .eq('ready', false);
      } catch { /* Account cleanup can retry this unused reservation later. */ }
    }
    return mobileError(request, asMobileError(error));
  }
}

export async function DELETE(request: Request) {
  try {
    const { client, user } = await actor(request);
    const input = parseMobileVideoUploadMutation(await readMobileJson(request));
    if (input.action !== 'delete') throw new MutationError(400, 'Confira o vídeo e tente novamente.');
    const claimed = await client.rpc('claim_unused_post_video', { p_path: input.path });
    if (claimed.error) mutationFailure(claimed.error);

    const admin = createAdminClient();
    const removed = await admin.storage.from(MOBILE_VIDEO_BUCKET).remove([input.path]);
    if (removed.error) throw new MutationError(503, 'Não foi possível remover o vídeo. Tente novamente.');
    const deleted = await admin
      .from('post_video_assets')
      .delete()
      .eq('path', input.path)
      .eq('player_id', user.id)
      .eq('deleting', true);
    if (deleted.error) mutationFailure(deleted.error);
    return mobileJson(request, { data: { deleted: true }, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

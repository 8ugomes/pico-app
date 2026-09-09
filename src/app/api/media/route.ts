import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/queries';
import { MutationError, exactKeys, mutationFailure } from '@/lib/supabase/mutations';
import { apiError, jsonBody, limitedBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { MEDIA_LIMIT, mediaBucket, mediaPath, removeUnusedMedia } from '@/lib/supabase/media';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function actor() {
  const client = await createClient();
  if (!client) throw new MutationError(503, 'O acesso às fotos está indisponível agora.');
  const user = await requireUser(client);
  return { client, user };
}
export async function GET(request: Request) {
  try {
    const { client } = await actor();
    const params = new URL(request.url).searchParams;
    const bucket = mediaBucket(params.get('bucket')), path = mediaPath(params.get('path'));
    const allowed = await client.rpc('can_read_media',{p_bucket:bucket,p_path:path});
    if (allowed.error) throw new MutationError(503,'Não foi possível conferir o acesso à foto.');
    if (!allowed.data) throw new MutationError(404,'Foto indisponível.');
    const { data, error } = await createAdminClient().storage.from(bucket).download(path,{cacheNonce:crypto.randomUUID()});
    if (error || !data) throw new MutationError(404, 'Foto indisponível.');
    return new Response(data, { headers: { ...privateHeaders, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="pico.webp"', 'Cross-Origin-Resource-Policy': 'same-origin' } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  let path: string | undefined;
  let reservedBucket: 'avatars' | 'post-media' | undefined;
  let ownerId: string | undefined;
  try {
    sameOrigin(request);
    const { client, user } = await actor();
    const admin = createAdminClient();
    const bucket = mediaBucket(new URL(request.url).searchParams.get('bucket'));
    if (!['image/jpeg','image/png','image/webp'].includes(request.headers.get('content-type') ?? '')) throw new MutationError(415, 'Escolha uma foto JPG, PNG ou WebP de até 3 MB.');
    const bytes = await limitedBody(request, MEDIA_LIMIT);
    const reserved = await client.rpc('reserve_media', { p_bucket: bucket });
    if (reserved.error) mutationFailure(reserved.error);
    path = reserved.data!; reservedBucket = bucket; ownerId = user.id;
    let normalized: Buffer;
    try {
      const decoder = sharp(bytes, { limitInputPixels: 25000000, animated: false });
      const metadata = await decoder.metadata();
      if (!['jpeg','png','webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1) throw new Error();
      normalized = await decoder.rotate().resize({ width: bucket === 'avatars' ? 512 : 1600, height: bucket === 'avatars' ? 512 : 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      if (normalized.length > MEDIA_LIMIT) throw new Error();
    } catch { throw new MutationError(400, 'Não foi possível ler essa foto. Use JPG, PNG ou WebP com até 25 megapixels.'); }
    const uploaded = await admin.storage.from(bucket).upload(path, normalized, { contentType: 'image/webp', cacheControl: '0', upsert: false });
    if (uploaded.error) throw new MutationError(503, 'Não foi possível enviar a foto. Tente novamente.');
    const ready = await admin.from('media_assets').update({ ready: true }).eq('path', path).eq('player_id', user.id).select('path').single();
    if (ready.error) mutationFailure(ready.error);
    return Response.json({ status: 'success', data: { path, bucket } }, { headers: privateHeaders });
  } catch (error) {
    if (path && reservedBucket && ownerId) {
      // An unsuccessful upload never consumes a permanent slot. If cleanup
      // fails, the owner can retry removal from the account's photo list.
      const admin = createAdminClient();
      const removed = await admin.storage.from(reservedBucket).remove([path]).catch(() => ({ error: true }));
      if (!removed.error) await admin.from('media_assets').delete().eq('path', path).eq('player_id', ownerId);
    }
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request); exactKeys(body, ['path','bucket']);
    const { client, user } = await actor();
    await removeUnusedMedia(client, createAdminClient(), user.id, mediaBucket(body.bucket), mediaPath(body.path));
    return Response.json({ status: 'success' }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

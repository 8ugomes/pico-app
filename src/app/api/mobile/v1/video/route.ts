import {
  mobileCorsHeaders,
  mobileError,
  mobileOptions,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { createAdminClient } from '@/lib/supabase/admin';
import { MutationError, mutationFailure } from '@/lib/supabase/mutations';
import { postVideoPath, videoRange } from '@/lib/supabase/post-video';
import { signedVideoRange } from '@/lib/supabase/post-video-stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function GET(request: Request) {
  try {
    const { accessToken } = validateMobileRequest(request);
    const client = createMobileDataClient(accessToken!);
    await requireMobileUser(client, accessToken!);
    const path = postVideoPath(new URL(request.url).searchParams.get('path'));
    const allowed = await client.rpc('can_read_post_video', { p_path: path });
    if (allowed.error) mutationFailure(allowed.error);
    if (!allowed.data) throw new MutationError(404, 'Vídeo indisponível.');
    const asset = await createAdminClient().from('post_video_assets').select('byte_size').eq('path', path).eq('ready', true).eq('deleting', false).maybeSingle();
    if (asset.error || !asset.data?.byte_size) throw new MutationError(404, 'Vídeo indisponível.');
    const size = asset.data.byte_size;
    const { start, end } = videoRange(request.headers.get('range'), size);
    const source = await signedVideoRange(path, start, end, size);
    const headers = new Headers(source.headers);
    Object.entries(mobileCorsHeaders(request.headers.get('origin'))).forEach(([key, value]) => headers.set(key, value));
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(end - start + 1));
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Type', 'video/mp4');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return new Response(source.body, { status: 206, headers });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

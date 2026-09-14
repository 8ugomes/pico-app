import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/queries';
import { MutationError, mutationFailure, uuid } from '@/lib/supabase/mutations';
import { apiError, privateHeaders } from '@/lib/supabase/api';
import { videoRange } from '@/lib/supabase/post-video';
import { signedVideoRange, videoResponse } from '@/lib/supabase/post-video-stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Vídeo indisponível.');
    await requireUser(client);
    const report = uuid(new URL(request.url).searchParams.get('report'));
    const access = await client.rpc('report_video', { p_report: report });
    if (access.error) mutationFailure(access.error);
    if (new URL(request.url).searchParams.get('kind') === 'available') return Response.json({ data: Boolean(access.data) }, { headers: privateHeaders });
    if (!access.data) throw new MutationError(404, 'Sem vídeo nesta denúncia.');
    const asset = await createAdminClient().from('post_video_assets').select('byte_size').eq('path', access.data).eq('ready', true).eq('deleting', false).maybeSingle();
    if (asset.error || !asset.data?.byte_size) throw new MutationError(404, 'Vídeo indisponível.');
    const size = asset.data.byte_size;
    const { start, end } = videoRange(request.headers.get('range'), size);
    const source = await signedVideoRange(access.data, start, end, size);
    return videoResponse(source, start, end, size);
  } catch (error) { return apiError(error); }
}

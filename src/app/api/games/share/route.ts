import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { MutationError, mutationFailure } from '@/lib/supabase/mutations';
import { mediaPath } from '@/lib/supabase/media';
import { parseGameShare } from '@/lib/supabase/game-sharing';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = parseGameShare(await jsonBody(request));
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Não foi possível conectar.');
    await requireUser(client);
    const result = await client.rpc('share_played_game', {
      p_id: input.id, p_version: input.version, p_key: input.key, p_body: input.body,
      p_image_path: input.imagePath ? mediaPath(input.imagePath) : undefined,
      p_audience: input.audience, p_wall_arena: input.wallArena, p_groups: input.groups,
    });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

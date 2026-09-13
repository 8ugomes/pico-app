import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, privateHeaders } from '@/lib/supabase/api';
import { MutationError, mutationFailure } from '@/lib/supabase/mutations';
import { gameOffset } from '@/lib/supabase/games';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const offset = gameOffset(new URL(request.url).searchParams);
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Não foi possível conectar.');
    await requireUser(client);
    const result = await client.rpc('read_retired_checkins', { p_offset: offset });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

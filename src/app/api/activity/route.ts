import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, privateHeaders } from '@/lib/supabase/api';
import { MutationError, mutationFailure, uuid } from '@/lib/supabase/mutations';
export const dynamic = 'force-dynamic';
// Only participation/interests remain here. Legacy history and sharing are retired.
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const kind = q.get('kind');
    if (!['places', 'common'].includes(kind ?? '')) throw new MutationError(410, 'Esta consulta foi desativada. Seus jogos ficam em Meus jogos.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    const offset = q.get('offset') ?? '0';
    if (!/^\d{1,5}$/.test(offset) || Number(offset) > 10000) throw new MutationError(400, 'Confira a página solicitada.');
    const result = kind === 'places'
      ? await client.rpc('profile_places', { p_player: q.get('player') ? uuid(q.get('player')) : undefined })
      : await client.rpc('discover_common_players', { p_offset: Number(offset) });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

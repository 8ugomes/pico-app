import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure, uuid } from '@/lib/supabase/mutations';
export const dynamic = 'force-dynamic';
// Only participation/interests remain here. Legacy history and sharing are retired.
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const kind = q.get('kind');
    if (!['places', 'common', 'played', 'played-own'].includes(kind ?? '')) throw new MutationError(410, 'Esta consulta foi desativada. Seus jogos ficam em Meus jogos.');
    if (kind === 'played-own' && q.has('player')) throw new MutationError(400, 'Esta consulta é só da sua conta.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    const offset = q.get('offset') ?? '0';
    if (!/^\d{1,5}$/.test(offset) || Number(offset) > 10000) throw new MutationError(400, 'Confira a página solicitada.');
    const result = kind === 'played-own'
      ? await client.rpc('read_own_played_arena_marks')
      : kind === 'played'
      ? await client.rpc('read_played_arena_marks', { p_player: q.get('player') ? uuid(q.get('player')) : undefined })
      : kind === 'places'
      ? await client.rpc('profile_places', { p_player: q.get('player') ? uuid(q.get('player')) : undefined })
      : await client.rpc('discover_common_players', { p_offset: Number(offset) });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = await jsonBody(request);
    exactKeys(input, ['action', 'arenaId', 'marked']);
    if (input.action !== 'set_played_arena_mark' || typeof input.marked !== 'boolean') throw new MutationError(400, 'Ação inválida.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    const result = await client.rpc('set_played_arena_mark', { p_arena: uuid(input.arenaId), p_mark: input.marked });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: { marked: input.marked } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

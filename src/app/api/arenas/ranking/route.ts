import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure, uuid } from '@/lib/supabase/mutations';
import { mediaUrl } from '@/lib/supabase/media';

export const dynamic = 'force-dynamic';
const periods = ['week', 'month', 'all'] as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type RankingRow = { rank: number; player_id: string; username: string; name: string; avatar_path: string | null; days: number; last_day: string };
type RankingPayload = { period: string; since: string | null; entries: RankingRow[]; me: { rank: number; days: number } | null; today_done: boolean; total_players: number };

// Check-ins are day-level, retrospective claims. Ranking reads go through RPCs; the table has no direct access.
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const period = q.get('period') ?? 'week';
    if (!periods.includes(period as (typeof periods)[number])) throw new MutationError(400, 'Período inválido.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    if (q.get('kind') === 'activity') {
      if (period === 'all') throw new MutationError(400, 'Período inválido.');
      const result = await client.rpc('read_arenas_activity', { p_period: period });
      if (result.error) mutationFailure(result.error);
      return Response.json({ data: result.data }, { headers: privateHeaders });
    }
    const result = await client.rpc('read_arena_ranking', { p_arena: uuid(q.get('arenaId')), p_period: period });
    if (result.error) mutationFailure(result.error);
    const data = result.data as unknown as RankingPayload;
    const entries = (data.entries ?? []).map(({ avatar_path, ...entry }) => ({ ...entry, avatar: mediaUrl('avatars', avatar_path) }));
    return Response.json({ data: { ...data, entries } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = await jsonBody(request);
    exactKeys(input, ['action', 'arenaId', 'day']);
    if (input.action !== 'record' && input.action !== 'remove') throw new MutationError(400, 'Ação inválida.');
    if (input.day !== undefined && (typeof input.day !== 'string' || !datePattern.test(input.day))) throw new MutationError(400, 'Confira a data.');
    if (input.action === 'remove' && !input.day) throw new MutationError(400, 'Confira a data.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    const arena = uuid(input.arenaId);
    const result = input.action === 'record'
      ? await client.rpc('record_arena_checkin', { p_arena: arena, ...(input.day ? { p_day: input.day as string } : {}) })
      : await client.rpc('remove_arena_checkin', { p_arena: arena, p_day: input.day as string });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: { ok: true } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

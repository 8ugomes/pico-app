import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { MutationError, mutationFailure } from '@/lib/supabase/mutations';
import { gameOffset, parseGameMutation } from '@/lib/supabase/games';
export const dynamic = 'force-dynamic';
async function gameClient() {
  const client = await createClient();
  if (!client) throw new MutationError(503, 'Não foi possível conectar.');
  await requireUser(client);
  return client;
}
export async function GET(request: Request) {
  try {
    const offset = gameOffset(new URL(request.url).searchParams);
    const client = await gameClient();
    const result = await client.rpc('read_played_games', { p_offset: offset });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = parseGameMutation(await jsonBody(request));
    const client = await gameClient();
    const result = input.action === 'delete'
      ? await client.rpc('delete_played_game', { p_id: input.id })
      : await client.rpc('save_played_game', { p_id: input.id, p_arena: input.arenaId, p_sport: input.sportId, p_played_on: input.playedOn, ...(input.version === undefined ? {} : { p_version: input.version }) });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: { id: input.id } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

import {
  MOBILE_API_VERSION,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { parseMobileGameMutation } from '@/lib/mobile/games';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { gameOffset } from '@/lib/supabase/games';
import { mutationFailure } from '@/lib/supabase/mutations';

export const dynamic = 'force-dynamic';

async function context(request: Request) {
  const { accessToken } = validateMobileRequest(request);
  const client = createMobileDataClient(accessToken!);
  await requireMobileUser(client, accessToken!);
  return client;
}

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function GET(request: Request) {
  try {
    const offset = gameOffset(new URL(request.url).searchParams);
    const client = await context(request);
    const result = await client.rpc('read_played_games', { p_offset: offset });
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: result.data, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

export async function POST(request: Request) {
  try {
    const input = parseMobileGameMutation(await readMobileJson(request));
    const client = await context(request);
    if (input.action === 'share') {
      const result = await client.rpc('share_played_game_media', {
        p_id: input.id,
        p_version: input.version,
        p_key: input.key,
        p_body: input.body,
        p_image_path: input.imagePath,
        p_video_path: input.videoPath,
        p_audience: input.audience,
        p_wall_arena: input.wallArena,
        p_groups: input.groups,
      });
      if (result.error) mutationFailure(result.error);
      return mobileJson(request, {
        data: { id: input.id, postId: result.data },
        apiVersion: MOBILE_API_VERSION,
      });
    }
    const result = input.action === 'delete'
      ? await client.rpc('delete_played_game', { p_id: input.id })
      : await client.rpc('save_played_game', {
          p_id: input.id,
          p_arena: input.arenaId,
          p_sport: input.sportId,
          p_played_on: input.playedOn,
          ...(input.version === undefined ? {} : { p_version: input.version }),
        });
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: { id: input.id }, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

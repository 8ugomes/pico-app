import {
  MOBILE_API_VERSION,
  MobileRequestError,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { contentField, exactKeys, mutationFailure, textField, uuid } from '@/lib/supabase/mutations';
import { mediaPath, mediaUrl } from '@/lib/supabase/media';
import { postVideoPath } from '@/lib/supabase/post-video';
import { MOBILE_VIDEO_PUBLISHING_ENABLED } from '@/lib/mobile/features';
import type { PostRecord } from '@/types/posts';

export const dynamic = 'force-dynamic';

async function context(request: Request) {
  const { accessToken } = validateMobileRequest(request);
  const client = createMobileDataClient(accessToken!);
  const user = await requireMobileUser(client, accessToken!);
  return { client, user };
}

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const { client, user } = await context(request);
    if (query.get('kind') === 'options') {
      const result = await client.rpc('publication_options');
      if (result.error) mutationFailure(result.error);
      return mobileJson(request, { data: result.data, apiVersion: MOBILE_API_VERSION });
    }
    const rawOffset = query.get('offset') || '0';
    if (!/^\d{1,5}$/.test(rawOffset) || Number(rawOffset) > 10_000) {
      throw new MobileRequestError(400, 'invalid_request', 'Não foi possível abrir essas publicações.');
    }
    const result = await client.rpc('read_repost_feed', {
      p_offset: Number(rawOffset),
      p_arena: query.get('arena') ? uuid(query.get('arena')) : undefined,
      p_community: query.get('community') ? uuid(query.get('community')) : undefined,
      p_author: query.get('author') ? uuid(query.get('author')) : undefined,
      p_post: query.get('post') ? uuid(query.get('post')) : undefined,
    });
    if (result.error) mutationFailure(result.error);
    const rows = (result.data || []) as unknown as PostRecord[];
    return mobileJson(request, {
      data: {
        posts: rows.slice(0, 20).map((post) => ({
          ...post,
          image: mediaUrl('post-media', post.image_path),
          video: post.video_path,
          avatar: mediaUrl('avatars', post.avatar_path),
        })),
        hasMore: rows.length > 20,
        viewerId: user.id,
      },
      apiVersion: MOBILE_API_VERSION,
    });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

export async function POST(request: Request) {
  try {
    const body = await readMobileJson(request);
    exactKeys(body, ['action', 'key', 'id', 'body', 'imagePath', 'videoPath', 'arena', 'sport', 'audience', 'wallArena', 'groups', 'community', 'reposted', 'mentionCommunity', 'mentionPeople', 'mentionEveryone']);
    const { client, user } = await context(request);
    let result;
    if (body.action === 'publish') {
      if (body.videoPath && !MOBILE_VIDEO_PUBLISHING_ENABLED) {
        throw new MobileRequestError(409, 'feature_unavailable', 'O envio de vídeo ainda não está disponível nesta versão do iPhone.');
      }
      if (!Array.isArray(body.groups) || body.groups.length > 5 || Boolean(body.imagePath && body.videoPath)) {
        throw new MobileRequestError(400, 'invalid_input', 'Escolha uma foto ou um vídeo e até cinco comunidades.');
      }
      if (!Array.isArray(body.mentionPeople) || body.mentionPeople.length > 20 || typeof body.mentionEveryone !== 'boolean') {
        throw new MobileRequestError(400, 'invalid_input', 'Confira as menções.');
      }
      result = await client.rpc('publish_post_with_mentions_media', {
        p_key: uuid(body.key),
        p_body: contentField(body.body, 1, 500),
        p_image_path: body.imagePath ? mediaPath(body.imagePath) : undefined,
        p_video_path: body.videoPath ? postVideoPath(body.videoPath) : undefined,
        p_arena: body.arena ? uuid(body.arena) : undefined,
        p_sport: body.sport ? uuid(body.sport) : undefined,
        p_audience: textField(body.audience, 1, 10),
        p_wall_arena: body.wallArena ? uuid(body.wallArena) : undefined,
        p_groups: body.groups.map(uuid),
        p_mention_community: body.mentionCommunity ? uuid(body.mentionCommunity) : undefined,
        p_people: body.mentionPeople.map(uuid),
        p_everyone: body.mentionEveryone,
      });
    } else if (body.action === 'repost') {
      exactKeys(body, ['action', 'id', 'reposted']);
      if (typeof body.reposted !== 'boolean') throw new MobileRequestError(400, 'invalid_input', 'Informe o estado da republicação.');
      result = await client.rpc('set_post_repost', { p_post: uuid(body.id), p_reposted: body.reposted });
    } else if (body.action === 'edit') {
      result = await client.from('posts').update({ body: contentField(body.body, 1, 500) }).eq('id', uuid(body.id)).eq('author_id', user.id).select('id');
      if (!result.error && !result.data?.length) throw new MobileRequestError(404, 'not_found', 'Publicação indisponível.');
    } else if (body.action === 'remove_distribution') {
      result = await client.rpc('remove_distribution', {
        p_post: uuid(body.id),
        p_arena: body.arena ? uuid(body.arena) : undefined,
        p_community: body.community ? uuid(body.community) : undefined,
      });
    } else {
      throw new MobileRequestError(400, 'invalid_action', 'A ação enviada não é válida.');
    }
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: result.data, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

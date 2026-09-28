import {
  MOBILE_API_VERSION,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { sanitizeMobileReadData } from '@/lib/mobile/data';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { parseReadRequest, readSocial } from '@/lib/supabase/read-service';
import { MutationError, mutateSocial, parseMutation } from '@/lib/supabase/mutations';
import { requireUser } from '@/lib/supabase/queries';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeUnusedMedia } from '@/lib/supabase/media';
import { productMeasurementEnabled } from '@/lib/features';
import { recordProductEvent } from '@/lib/product-measurement';

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
    const input = parseReadRequest(new URL(request.url).searchParams);
    const { client, user } = await context(request);
    const data = await readSocial(client, input);
    if (productMeasurementEnabled()) {
      recordProductEvent({ actorId: user.id, eventType: 'return_active' });
      if (data.kind === 'player' && !data.own) recordProductEvent({ actorId: user.id, eventType: 'discovery_opened', contextType: 'profile' });
    }
    return mobileJson(request, { data: sanitizeMobileReadData(data), apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

export async function POST(request: Request) {
  try {
    const input = parseMutation(await readMobileJson(request));
    if (input.action === 'create_comment' && !input.key) {
      throw new MutationError(400, 'Atualize o aplicativo antes de comentar.');
    }
    const { client } = await context(request);
    let photo: string | null = null;
    let ownerId: string | null = null;
    if (input.action === 'delete_post') {
      const user = await requireUser(client);
      ownerId = user.id;
      const post = await client.from('posts').select('image_path').eq('id', input.id).eq('author_id', user.id).maybeSingle();
      if (post.error) throw post.error;
      photo = post.data?.image_path ?? null;
      if (photo) createAdminClient();
    }
    await mutateSocial(client, input);
    if (photo && ownerId) await removeUnusedMedia(client, createAdminClient(), ownerId, 'post-media', photo);
    return mobileJson(request, { data: { saved: true }, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

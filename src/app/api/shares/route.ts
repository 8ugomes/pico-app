import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { MutationError } from '@/lib/supabase/mutations';
import { configuredPublicOrigin, parseShareTarget, resolveShareDescriptor, shareUrl } from '@/lib/sharing/targets';
import { recordProductEvent } from '@/lib/product-measurement';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const target = parseShareTarget(await jsonBody(request));
    const client = await createClient();
    if (!client) throw new MutationError(503, 'O compartilhamento está indisponível agora.');
    const user = await requireUser(client);
    const descriptor = await resolveShareDescriptor(client, user.id, target);
    const url = shareUrl(configuredPublicOrigin(), descriptor);
    recordProductEvent({ actorId: user.id, eventType: 'share_prepared', contextType: descriptor.kind });
    return Response.json({
      data: {
        title: descriptor.title,
        url,
      },
    }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

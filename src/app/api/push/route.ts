import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure, uuid } from '@/lib/supabase/mutations';
import { getPushConfig, parsePushSubscription, pushEndpoint } from '@/lib/push/policy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    if (new URL(request.url).search) throw new MutationError(400, 'Consulta inválida.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Notificações indisponíveis agora.');
    const user = await requireUser(client);
    const config = getPushConfig();
    if (!config) return Response.json({ data: { enabled: false, viewerId: user.id } }, { headers: privateHeaders });
    const result = await client.rpc('read_push_subscription');
    if (result.error) mutationFailure(result.error);
    const settings = result.data as { enabled?: boolean } | null;
    return Response.json({ data: { enabled: settings?.enabled === true, viewerId: user.id, ...(settings?.enabled ? { publicKey: config.publicKey } : {}) } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Notificações indisponíveis agora.');
    const user = await requireUser(client);
    if (body.action === 'subscribe') {
      exactKeys(body, ['action', 'subscription', 'expectedViewerId']);
      if (uuid(body.expectedViewerId) !== user.id) throw new MutationError(403, 'Sua conta mudou. Confira as notificações antes de ativar novamente.');
      if (!getPushConfig()) throw new MutationError(503, 'As notificações no aparelho ainda não estão disponíveis.');
      const subscription = parsePushSubscription(body.subscription);
      const result = await client.rpc('save_push_subscription', {
        p_endpoint: subscription.endpoint, p_p256dh: subscription.keys.p256dh, p_auth: subscription.keys.auth,
      });
      if (result.error) mutationFailure(result.error);
      return Response.json({ data: { subscribed: true, viewerId: user.id } }, { headers: privateHeaders });
    }
    if (body.action !== 'status' && body.action !== 'unsubscribe') throw new MutationError(400, 'Ação inválida.');
    exactKeys(body, ['action', 'endpoint']);
    const endpoint = pushEndpoint(body.endpoint);
    const result = body.action === 'unsubscribe'
      ? await client.rpc('delete_push_subscription', { p_endpoint: endpoint })
      : await client.rpc('read_push_subscription', { p_endpoint: endpoint });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: body.action === 'unsubscribe' ? { subscribed: false } : result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure, textField } from '@/lib/supabase/mutations';
import { recordProductEvent } from '@/lib/product-measurement';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    exactKeys(body, ['kind', 'token']);
    const kind = textField(body.kind, 1, 20);
    if (kind !== 'arena' && kind !== 'community') throw new MutationError(400, 'Convite inválido.');
    const token = textField(body.token, 64, 64);
    if (!/^[a-f0-9]{64}$/.test(token)) throw new MutationError(400, 'Convite inválido.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Convite indisponível.');
    const user = await requireUser(client);
    const result = await client.rpc('preview_scope_invitation', { p_kind: kind, p_token: token });
    if (result.error) mutationFailure(result.error);
    if (typeof result.data !== 'string') throw new MutationError(403, 'Convite indisponível.');
    recordProductEvent({ actorId: user.id, eventType: 'invitation_opened', contextType: 'invitation', contextId: result.data });
    return Response.json({ data: { available: true } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

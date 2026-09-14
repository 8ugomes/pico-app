import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure, uuid } from '@/lib/supabase/mutations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some(key => key !== 'before') || query.getAll('before').length > 1) throw new MutationError(400, 'Consulta inválida.');
    const before = query.has('before') ? uuid(query.get('before')) : undefined;
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    const result = await client.rpc('read_notifications', { p_before: before });
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: result.data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    if (body.action === 'read') {
      exactKeys(body, ['action', 'ids']);
      if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 100) throw new MutationError(400, 'Selecione as notificações.');
    } else if (body.action === 'read-all') {
      exactKeys(body, ['action']);
    } else throw new MutationError(400, 'Ação inválida.');
    const ids = body.action === 'read' ? (body.ids as unknown[]).map(uuid) : [];
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    const result = body.action === 'read'
      ? await client.rpc('mark_notifications_read', { p_ids: ids })
      : await client.rpc('mark_all_notifications_read');
    if (result.error) mutationFailure(result.error);
    return Response.json({ data: { saved: true } }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

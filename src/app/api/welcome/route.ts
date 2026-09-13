import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { exactKeys, MutationError, mutationFailure } from '@/lib/supabase/mutations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    exactKeys(body, ['action']);
    if (body.action !== 'check' && body.action !== 'acknowledge') throw new MutationError(400, 'Ação inválida.');
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Configuração indisponível.');
    await requireUser(client);
    if (body.action === 'check') {
      const { error } = await client.rpc('ensure_pico_membership');
      if (error) mutationFailure(error);
    }
    const { data, error } = await client.rpc('pico_welcome', { p_acknowledge: body.action === 'acknowledge' });
    if (error) mutationFailure(error);
    return Response.json({ data }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

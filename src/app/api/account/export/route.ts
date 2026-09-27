import { createClient } from '@/lib/supabase/server';
import { buildAccountArchive } from '@/lib/supabase/account-export';
import { requireUser } from '@/lib/supabase/queries';
import { reauthenticate } from '@/lib/supabase/reauthenticate';
import { MutationError, exactKeys } from '@/lib/supabase/mutations';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request); exactKeys(body, ['password']);
    const client = await createClient();
    if (!client) throw new MutationError(503, 'Não foi possível conectar agora.');
    const user = await requireUser(client);
    await reauthenticate(user, body.password);
    const archive = await buildAccountArchive(user);
    return Response.json(archive, { headers: { ...privateHeaders, 'Content-Disposition': 'attachment; filename="meus-dados-pico.json"' } });
  } catch (error) { return apiError(error); }
}

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/queries';
import { reauthenticate } from '@/lib/supabase/reauthenticate';
import { MutationError, exactKeys, mutationFailure } from '@/lib/supabase/mutations';
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
    // Social suspension must not block the account holder's privacy rights.
    // The service-only RPC receives exclusively the server-verified subject.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('export_account_data', { p_user: user.id });
    if (error?.code === 'P0413') throw new MutationError(413, 'Seu histórico excede o tamanho do download automático. Solicite uma cópia pelo contato de privacidade.');
    if (error) mutationFailure(error);
    const extra = await admin.rpc('export_account_media_extra', { p_user: user.id });
    if (extra.error) mutationFailure(extra.error);
    return Response.json({ format: 'pico-account-v1', exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, createdAt: user.created_at, emailConfirmedAt: user.email_confirmed_at }, data: { ...(data as Record<string, unknown>), ...(extra.data as Record<string, unknown>) }, media: 'Referências de fotos e vídeos; este arquivo não contém os bytes dos arquivos.' }, { headers: { ...privateHeaders, 'Content-Disposition': 'attachment; filename="meus-dados-pico.json"' } });
  } catch (error) { return apiError(error); }
}

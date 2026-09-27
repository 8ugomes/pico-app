import {
  MOBILE_API_VERSION,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { createAdminClient } from '@/lib/supabase/admin';
import { reauthenticate } from '@/lib/supabase/reauthenticate';
import { exactKeys, MutationError, mutationFailure } from '@/lib/supabase/mutations';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function POST(request: Request) {
  try {
    const body = await readMobileJson(request);
    exactKeys(body, ['password']);
    const { accessToken } = validateMobileRequest(request);
    const client = createMobileDataClient(accessToken!);
    const user = await requireMobileUser(client, accessToken!);
    await reauthenticate(user, body.password);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('export_account_data', { p_user: user.id });
    if (error?.code === 'P0413') {
      throw new MutationError(413, 'Seu histórico excede o download automático. Fale com o contato de privacidade.');
    }
    if (error) mutationFailure(error);
    const extra = await admin.rpc('export_account_media_extra', { p_user: user.id });
    if (extra.error) mutationFailure(extra.error);
    return mobileJson(request, {
      data: {
        format: 'pico-account-v1',
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          emailConfirmedAt: user.email_confirmed_at,
        },
        data: { ...(data as Record<string, unknown>), ...(extra.data as Record<string, unknown>) },
        media: 'Referências de fotos e vídeos; este arquivo não contém os bytes dos arquivos.',
      },
      apiVersion: MOBILE_API_VERSION,
    }, { headers: { 'Content-Disposition': 'attachment; filename="meus-dados-pico.json"' } });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

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
import { buildAccountArchive } from '@/lib/supabase/account-export';
import { reauthenticate } from '@/lib/supabase/reauthenticate';
import { exactKeys } from '@/lib/supabase/mutations';

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
    const archive = await buildAccountArchive(user);
    return mobileJson(request, {
      data: archive,
      apiVersion: MOBILE_API_VERSION,
    }, { headers: { 'Content-Disposition': 'attachment; filename="meus-dados-pico.json"' } });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

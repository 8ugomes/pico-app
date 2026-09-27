import {
  MOBILE_API_VERSION,
  MobileRequestError,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { exactKeys, mutationFailure, uuid } from '@/lib/supabase/mutations';

export const dynamic = 'force-dynamic';

async function context(request: Request) {
  const { accessToken } = validateMobileRequest(request);
  const client = createMobileDataClient(accessToken!);
  await requireMobileUser(client, accessToken!);
  return client;
}

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some((key) => key !== 'before') || query.getAll('before').length > 1) {
      throw new MobileRequestError(400, 'invalid_request', 'Consulta inválida.');
    }
    const before = query.has('before') ? uuid(query.get('before')) : undefined;
    const client = await context(request);
    const result = await client.rpc('read_notifications', { p_before: before });
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: result.data, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

export async function POST(request: Request) {
  try {
    const body = await readMobileJson(request);
    if (body.action === 'read') {
      exactKeys(body, ['action', 'ids']);
      if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 100) {
        throw new MobileRequestError(400, 'invalid_input', 'Selecione as notificações.');
      }
    } else if (body.action === 'read-all') {
      exactKeys(body, ['action']);
    } else {
      throw new MobileRequestError(400, 'invalid_action', 'A ação enviada não é válida.');
    }
    const ids = body.action === 'read' ? (body.ids as unknown[]).map(uuid) : [];
    const client = await context(request);
    const result = body.action === 'read'
      ? await client.rpc('mark_notifications_read', { p_ids: ids })
      : await client.rpc('mark_all_notifications_read');
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: { saved: true }, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

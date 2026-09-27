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

export async function GET(request: Request) {
  try {
    const { accessToken } = validateMobileRequest(request);
    const client = createMobileDataClient(accessToken!);
    await requireMobileUser(client, accessToken!);
    const access = await client.rpc('mobile_account_access_state');
    if (access.error) mutationFailure(access.error);
    const accessStatus = access.data;
    if (typeof accessStatus !== 'string' || !['active', 'suspended', 'revoked', 'restricted', 'deletion_pending'].includes(accessStatus)) {
      throw new MutationError(503, 'Não foi possível conferir o estado da conta agora.');
    }
    return mobileJson(request, {
      data: { deletionPending: accessStatus === 'deletion_pending', accessStatus },
      apiVersion: MOBILE_API_VERSION,
    });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await readMobileJson(request);
    exactKeys(body, ['password', 'confirmation']);
    if (body.confirmation !== 'EXCLUIR' || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128) {
      throw new MutationError(400, 'Digite EXCLUIR e confirme sua senha.');
    }
    const { accessToken } = validateMobileRequest(request);
    const client = createMobileDataClient(accessToken!);
    const user = await requireMobileUser(client, accessToken!);
    await reauthenticate(user, body.password);
    const admin = createAdminClient();
    const pending = await admin.from('account_deletions').upsert({ player_id: user.id });
    if (pending.error?.code === 'P0409') {
      throw new MutationError(409, 'Antes de excluir, transfira a administração do Pico para outra conta ativa.');
    }
    if (pending.error) mutationFailure(pending.error);

    for (const bucket of ['avatars', 'post-media', 'post-videos']) {
      let empty = false;
      for (let page = 0; page < 10; page += 1) {
        const list = await admin.storage.from(bucket).list(user.id, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
        if (list.error) throw new MutationError(503, 'A exclusão foi iniciada. Tente novamente para concluir a remoção da mídia.');
        if (!list.data.length) {
          empty = true;
          break;
        }
        const removed = await admin.storage.from(bucket).remove(list.data.map((file) => `${user.id}/${file.name}`));
        if (removed.error) throw new MutationError(503, 'A exclusão foi iniciada. Tente novamente para concluir a remoção da mídia.');
      }
      if (!empty) throw new MutationError(503, 'Uma parte da mídia foi removida. Repita a exclusão para concluir.');
    }

    const personal = await admin.rpc('erase_account_private_data', { p_user: user.id });
    if (personal.error) mutationFailure(personal.error);
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) throw new MutationError(503, 'A exclusão foi iniciada. Tente novamente para concluir.');
    return mobileJson(request, { data: { deleted: true }, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reauthenticate } from '@/lib/supabase/reauthenticate';
import { requireUser } from '@/lib/supabase/queries';
import { MutationError, exactKeys, mutationFailure } from '@/lib/supabase/mutations';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request); exactKeys(body,['password','confirmation']);
    if (body.confirmation !== 'EXCLUIR' || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128) throw new MutationError(400,'Digite EXCLUIR e confirme sua senha.');
    const client = await createClient();
    if (!client) throw new MutationError(503,'Não foi possível conectar agora.');
    const user = await requireUser(client);
    await reauthenticate(user, body.password);
    const admin = createAdminClient();
    const pending = await admin.from('account_deletions').upsert({player_id:user.id});
    if (pending.error?.code === 'P0409') throw new MutationError(409, 'Antes de excluir, transfira a administração do Pico para outra conta ativa.');
    if (pending.error) mutationFailure(pending.error);
    // A pending marker denies further client writes while cleanup is retried.
    // Storage must be deleted through its API, never by deleting its SQL rows.
    for (const bucket of ['avatars','post-media']) {
      // Always remove the first page. Advancing an offset after deletion skips
      // objects. Bound each attempt; the pending marker allows safe resumption.
      let empty = false;
      for (let page = 0; page < 10; page++) {
        const list = await admin.storage.from(bucket).list(user.id, {limit:100, sortBy:{column:'name',order:'asc'}});
        if (list.error) throw new MutationError(503,'A exclusão foi iniciada. Tente novamente para concluir a remoção das fotos.');
        if (!list.data.length) { empty = true; break; }
        const removed = await admin.storage.from(bucket).remove(list.data.map(file=>`${user.id}/${file.name}`));
        if (removed.error) throw new MutationError(503,'A exclusão foi iniciada. Tente novamente para concluir a remoção das fotos.');
      }
      if (!empty) throw new MutationError(503,'Uma parte das fotos foi removida. Repita a exclusão para concluir.');
    }
    // Remove invitations addressed to this verified account, including expired
    // ones. Recipient emails are private data, not part of entity custody.
    const personal = await admin.rpc('erase_account_private_data', {p_user:user.id});
    if (personal.error) mutationFailure(personal.error);
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) throw new MutationError(503,'A exclusão foi iniciada. Tente novamente para concluir.');
    await client.auth.signOut({scope:'local'});
    return Response.json({status:'success'},{headers:{...privateHeaders,'Clear-Site-Data':'"cache"'}});
  } catch (error) { return apiError(error); }
}

import { createClient as createAuthClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { requireUser } from '@/lib/supabase/queries';
import { MutationError, exactKeys, mutationFailure } from '@/lib/supabase/mutations';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request); exactKeys(body,['password','confirmation']);
    if (body.confirmation !== 'EXCLUIR' || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128) throw new MutationError(400,'Digite EXCLUIR e confirme sua senha.');
    const client = await createClient(), config = getSupabaseConfig();
    if (!client || !config) throw new MutationError(503,'Não foi possível conectar agora.');
    const user = await requireUser(client);
    if (!user.email) throw new MutationError(400,'Confirme o acesso por e-mail antes de continuar.');
    // A fresh password check uses an isolated client, never changing the caller's
    // cookies and never accepting a target id/email from the request body.
    const verify = createAuthClient(config.url,config.key,{ auth: { persistSession:false,autoRefreshToken:false,detectSessionInUrl:false }, global: { fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(15000)}) } });
    const signed = await verify.auth.signInWithPassword({email:user.email,password:body.password});
    if (signed.error || signed.data.user?.id !== user.id) throw new MutationError(403,'Senha incorreta. Confira antes de excluir.');
    await verify.auth.signOut({scope:'local'});
    const admin = createAdminClient();
    const pending = await admin.from('account_deletions').upsert({player_id:user.id});
    if (pending.error) mutationFailure(pending.error);
    // A pending marker denies further client writes while cleanup is retried.
    // Storage must be deleted through its API, never by deleting its SQL rows.
    for (const bucket of ['avatars','post-media']) {
      const list = await admin.storage.from(bucket).list(user.id,{limit:1000});
      if (list.error) throw new MutationError(503,'A exclusão foi iniciada. Tente novamente para concluir a remoção das fotos.');
      if (list.data.length) {
        const removed = await admin.storage.from(bucket).remove(list.data.map(file=>`${user.id}/${file.name}`));
        if (removed.error) throw new MutationError(503,'A exclusão foi iniciada. Tente novamente para concluir a remoção das fotos.');
      }
    }
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) throw new MutationError(503,'A exclusão foi iniciada. Tente novamente para concluir.');
    await client.auth.signOut({scope:'local'});
    return Response.json({status:'success'},{headers:{...privateHeaders,'Clear-Site-Data':'"cache"'}});
  } catch (error) { return apiError(error); }
}

import 'server-only';
import { createClient as createAuthClient, type User } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';
import { MutationError } from './mutations';

export async function reauthenticate(user: User, password: unknown) {
  if (typeof password !== 'string' || password.length < 1 || password.length > 128) throw new MutationError(400, 'Confirme sua senha atual.');
  const config = getSupabaseConfig();
  if (!config) throw new MutationError(503, 'Não foi possível conectar agora.');
  if (!user.email) throw new MutationError(400, 'Confirme o acesso por e-mail antes de continuar.');
  const verify = createAuthClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000) }) },
  });
  const signed = await verify.auth.signInWithPassword({ email: user.email, password });
  if (signed.error) {
    if (signed.error.status === 429) throw new MutationError(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    if (signed.error.status && signed.error.status >= 500) throw new MutationError(503, 'Não foi possível confirmar sua senha agora.');
    throw new MutationError(403, 'Senha incorreta. Confira antes de continuar.');
  }
  const sameUser = signed.data.user?.id === user.id;
  await verify.auth.signOut({ scope: 'local' });
  if (!sameUser) throw new MutationError(403, 'Não foi possível confirmar sua identidade.');
}

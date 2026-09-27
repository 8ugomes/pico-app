import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/types/app-database';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { MobileRequestError } from './api-contract';

function configuredEnvironment() {
  const environment = getSupabaseEnvironment();
  if (environment.status !== 'configured') {
    throw new MobileRequestError(503, 'service_unavailable', 'O acesso às contas não está disponível agora.');
  }
  return environment;
}

export function createMobileAuthClient() {
  const environment = configuredEnvironment();
  return createClient<Database>(environment.url, environment.key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createMobileDataClient(accessToken: string) {
  const environment = configuredEnvironment();
  return createClient<Database>(environment.url, environment.key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function requireMobileUser(
  client: SupabaseClient<Database>,
  accessToken: string,
): Promise<User> {
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new MobileRequestError(401, 'invalid_session', 'Sua sessão terminou. Entre novamente.');
  }
  return data.user;
}

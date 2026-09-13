import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getSupabaseEnvironment } from './config';
import { MutationError } from './mutations';

// Only media processing and verified account privacy operations use this client.
// Never inherit a browser session or expose this credential in a response.
export function createAdminClient() {
  const config = getSupabaseEnvironment();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (config.status !== 'configured' || !secret?.startsWith('sb_secret_')) {
    throw new MutationError(503, 'Esta ação está indisponível agora. Tente mais tarde.');
  }
  return createClient<Database>(config.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(20000) }) },
  });
}

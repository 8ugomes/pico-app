import environments from '../../../../config/environments.json';
import { createHealthHandler } from '@/lib/health';
import { getSupabaseConfig } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

export const GET = createHealthHandler(() => {
  const purpose = process.env.NEXT_PUBLIC_PICO_ENV;
  const config = getSupabaseConfig();
  if (!config || (purpose !== 'beta' && purpose !== 'development')) return null;
  return { ...config, purpose, projectRef: environments[purpose].projectRef };
});

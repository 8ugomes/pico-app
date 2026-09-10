import environments from '../../../config/environments.json' with { type: 'json' };
export type SupabaseEnvironment =
  | { status: 'demo' }
  | { status: 'invalid' }
  | { status: 'configured'; url: string; key: string };

export function resolveSupabaseEnvironment(rawUrl?: string, rawKey?: string): SupabaseEnvironment {
  const url = rawUrl?.trim();
  const key = rawKey?.trim();
  if (!url && !key) return { status: 'demo' };
  if (!url || !key || key.startsWith('sb_secret_')) return { status: 'invalid' };
  try {
    const parsed = new URL(url);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) || parsed.username || parsed.password || parsed.search || parsed.hash) return { status: 'invalid' };
    // Reject privileged legacy keys as well as modern secret keys. No key is logged.
    if (key.split('.').length === 3) {
      const payload = JSON.parse(atob(key.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')));
      if (payload.role !== 'anon') return { status: 'invalid' };
    }
    return { status: 'configured', url: parsed.href.replace(/\/$/, ''), key };
  } catch { return { status: 'invalid' }; }
}

export function getSupabaseEnvironment() {
  const purpose = process.env.NEXT_PUBLIC_PICO_ENV;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (purpose === 'demo') return !url && !key ? { status: 'demo' } as const : { status: 'invalid' } as const;
  if (purpose !== 'development' && purpose !== 'beta') return { status: 'invalid' } as const;
  if (environments[purpose].url !== url) return { status: 'invalid' } as const;
  return resolveSupabaseEnvironment(url, key);
}

export function getSupabaseConfig() {
  const environment = getSupabaseEnvironment();
  return environment.status === 'configured' ? { url: environment.url, key: environment.key } : null;
}

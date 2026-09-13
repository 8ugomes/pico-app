import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import type { Database } from "@/types/app-database";

export function createClient() {
  const config = getSupabaseConfig();
  return config ? createBrowserClient<Database>(config.url, config.key, { cookieOptions: { sameSite: 'lax', secure: process.env.NEXT_PUBLIC_PICO_ENV === 'beta' || process.env.NEXT_PUBLIC_PICO_ENV === 'production' } }) : null;
}

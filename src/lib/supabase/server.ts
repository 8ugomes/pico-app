import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

// For Route Handlers and Server Actions, which can write session cookies.
// Add the documented session-refresh proxy before using auth in Server Components.
export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
}

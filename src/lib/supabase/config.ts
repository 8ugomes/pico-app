export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const parsed = new URL(url);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) return null;
    return { url, key };
  } catch {
    return null;
  }
}

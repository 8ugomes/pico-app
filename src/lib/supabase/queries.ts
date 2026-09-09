import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Explicit client required. Social demo screens never invoke these functions.
// No fallback to mocks on database errors: callers must handle error/empty/loading.
export function listPublicArenas(client: SupabaseClient<Database>) {
  return client.from("arenas").select("id, slug, name, description, neighborhood, city, image_path").eq("is_public", true).order("name").limit(50);
}
export function getArenaBySlug(client: SupabaseClient<Database>, slug: string) {
  return client.from("arenas").select("*").eq("slug", slug).eq("is_public", true).maybeSingle();
}
export function listArenaPosts(client: SupabaseClient<Database>, arenaId: string, offset = 0, limit = 20) {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new RangeError("Invalid pagination");
  return client.from("posts").select("id, author_id, arena_id, sport_id, body, image_path, created_at").eq("arena_id", arenaId).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + limit - 1);
}
export function getPublicProfile(client: SupabaseClient<Database>, username: string) {
  return client.from("profiles").select("id, username, display_name, bio, neighborhood, avatar_path, available").eq("username", username).maybeSingle();
}

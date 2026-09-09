// Handwritten V1 contract for future integration. Replace with generated types
// after applying reviewed migrations to Supabase; not evidence of a deployed schema.
import type { SportId, Level } from "./social";
type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };
type Audit = { created_at: string };
type Profile = Audit & { id: string; username: string; display_name: string; bio: string; neighborhood: string; avatar_path: string | null; available: boolean };
type Sport = { id: string; slug: SportId; name: string };
type Arena = Audit & { id: string; slug: string; name: string; description: string; neighborhood: string; city: string; image_path: string | null; is_public: boolean };
type Post = Audit & { id: string; author_id: string; arena_id: string; sport_id: string; body: string; image_path: string | null };
type Checkin = { id: string; player_id: string; arena_id: string; sport_id: string; started_at: string; expires_at: string; ended_at: string | null };
type Connection = Audit & { follower_id: string; following_id: string };
type Comment = Audit & { id: string; post_id: string; author_id: string; body: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Pick<Profile, "id" | "username" | "display_name"> & Partial<Omit<Profile, "id" | "username" | "display_name">>>;
      sports: Table<Sport, Omit<Sport, "id"> & { id?: string }>;
      arenas: Table<Arena, Pick<Arena, "slug" | "name" | "city" | "neighborhood"> & Partial<Omit<Arena, "slug" | "name" | "city" | "neighborhood">>>;
      arena_sports: Table<{ arena_id: string; sport_id: string }, { arena_id: string; sport_id: string }>;
      player_sports: Table<{ player_id: string; sport_id: string; level: Level }, { player_id: string; sport_id: string; level: Level }>;
      arena_members: Table<Audit & { arena_id: string; player_id: string }, { arena_id: string; player_id: string }>;
      posts: Table<Post, Pick<Post, "author_id" | "arena_id" | "sport_id" | "body"> & { image_path?: string | null }>;
      checkins: Table<Checkin, never>;
      connections: Table<Connection, Pick<Connection, "follower_id" | "following_id">>;
      post_likes: Table<Audit & { post_id: string; player_id: string }, { post_id: string; player_id: string }>;
      comments: Table<Comment, Pick<Comment, "post_id" | "author_id" | "body">>;
    };
    Views: Record<never, never>;
    Functions: {
      start_checkin: { Args: { arena_id: string; sport_id: string }; Returns: Checkin };
      end_checkin: { Args: Record<never, never>; Returns: undefined };
    };
    Enums: { sport_slug: SportId; player_level: Level };
    CompositeTypes: Record<never, never>;
  };
};

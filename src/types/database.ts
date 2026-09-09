// Cycle 1: client contract aligned with versioned migrations, not a deployed schema.
// Insert/Update intentionally narrow to columns granted to authenticated clients.
// Replace with Supabase-generated types when connecting a configured project.
import type { SportId, Level } from './social';
type Relationship = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };
type Table<Row, Insert, Update = Partial<Insert>, Relations extends Relationship[] = []> = { Row: Row; Insert: Insert; Update: Update; Relationships: Relations };
type Audit = { created_at: string };
export type ProfileRow = Audit & {
  id: string; username: string; display_name: string; bio: string; city: string;
  neighborhood: string; avatar_path: string | null; available: boolean;
  onboarding_completed: boolean; is_demo: boolean;
};
export type SportRow = { id: string; slug: SportId; name: string };
export type ArenaRow = Audit & { id: string; slug: string; name: string; description: string; neighborhood: string; city: string; image_path: string | null; is_public: boolean; is_demo: boolean };
export type PostRow = Audit & { id: string; author_id: string; arena_id: string; sport_id: string; body: string; image_path: string | null };
export type CheckinRow = { id: string; player_id: string; arena_id: string; sport_id: string; started_at: string; expires_at: string; ended_at: string | null };
export type CommentRow = Audit & { id: string; post_id: string; author_id: string; body: string };
export type PlayerSportRow = { player_id: string; sport_id: string; level: Level; is_primary: boolean };
type ProfileEdit = Partial<Pick<ProfileRow, 'username' | 'display_name' | 'bio' | 'city' | 'neighborhood' | 'avatar_path' | 'available' | 'onboarding_completed'>>;
type ForeignKey<Name extends string, Column extends string, Relation extends string> = { foreignKeyName: Name; columns: [Column]; isOneToOne: false; referencedRelation: Relation; referencedColumns: ['id'] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, never, ProfileEdit>;
      sports: Table<SportRow, never, never>;
      arenas: Table<ArenaRow, never, never>;
      arena_sports: Table<{ arena_id: string; sport_id: string }, never, never, [ForeignKey<'arena_sports_arena_id_fkey', 'arena_id', 'arenas'>, ForeignKey<'arena_sports_sport_id_fkey', 'sport_id', 'sports'>]>;
      player_sports: Table<PlayerSportRow, { player_id?: string; sport_id: string; level?: Level; is_primary?: boolean }, Partial<Pick<PlayerSportRow, 'level' | 'is_primary'>>, [ForeignKey<'player_sports_player_id_fkey', 'player_id', 'profiles'>, ForeignKey<'player_sports_sport_id_fkey', 'sport_id', 'sports'>]>;
      arena_members: Table<Audit & { arena_id: string; player_id: string }, { arena_id: string; player_id?: string }, never, [ForeignKey<'arena_members_arena_id_fkey', 'arena_id', 'arenas'>, ForeignKey<'arena_members_player_id_fkey', 'player_id', 'profiles'>]>;
      posts: Table<PostRow, { author_id?: string; arena_id: string; sport_id: string; body: string; image_path?: string | null }, Partial<Pick<PostRow, 'body' | 'image_path'>>, [ForeignKey<'posts_author_id_fkey', 'author_id', 'profiles'>, { foreignKeyName: 'posts_arena_id_sport_id_fkey'; columns: ['arena_id', 'sport_id']; isOneToOne: false; referencedRelation: 'arena_sports'; referencedColumns: ['arena_id', 'sport_id'] }]>;
      checkins: Table<CheckinRow, never, never, [ForeignKey<'checkins_player_id_fkey', 'player_id', 'profiles'>, { foreignKeyName: 'checkins_arena_id_sport_id_fkey'; columns: ['arena_id', 'sport_id']; isOneToOne: false; referencedRelation: 'arena_sports'; referencedColumns: ['arena_id', 'sport_id'] }]>;
      post_likes: Table<Audit & { post_id: string; player_id: string }, { post_id: string; player_id?: string }, never, [ForeignKey<'post_likes_post_id_fkey', 'post_id', 'posts'>, ForeignKey<'post_likes_player_id_fkey', 'player_id', 'profiles'>]>;
      comments: Table<CommentRow, { post_id: string; author_id?: string; body: string }, Partial<Pick<CommentRow, 'body'>>, [ForeignKey<'comments_post_id_fkey', 'post_id', 'posts'>, ForeignKey<'comments_author_id_fkey', 'author_id', 'profiles'>]>;
    };
    Views: Record<never, never>;
    // Trigger functions aren't callable RPCs. Check-in RPCs arrive in Cycle 4.
    Functions: Record<never, never>;
    Enums: { sport_slug: SportId; player_level: Level };
    CompositeTypes: Record<never, never>;
  };
};

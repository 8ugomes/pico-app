import type { Database } from './database';
import type { Level, SportId } from './social';
export type FeedRow = Database['public']['Functions']['read_feed']['Returns'][number] & { image: string | null; avatar: string | null; imagePath: string | null };
type DiscoveryResult = Database['public']['Functions']['discover_players']['Returns'][number];
export type DiscoveryRow = Omit<DiscoveryResult, 'arena_name' | 'arena_slug' | 'expires_at' | 'available'> & { avatar: string | null };
export type ReadSport = { id: string; slug: SportId; name: string };
export type ReadArena = {
  id: string; slug: string; name: string; description: string;
  neighborhood: string; city: string; image: string | null; isDemo: boolean;
  sports: ReadSport[];
};
export type ReadProfile = {
  id: string; username: string; name: string; bio: string; city: string; avatar: string | null; avatarPath: string | null;
  neighborhood: string; available: boolean; isDemo: boolean; onboardingCompleted: boolean;
  sports: { sport: ReadSport; level: Level; isPrimary: boolean }[];
};
export type ReadComment = { id: string; authorId: string; body: string; createdAt: string; name: string; username: string };
export type ReadRequest = { resource: 'discover'; offset: number; sportId?: string; arenaId?: string; level?: Level } | { resource: 'player'; username: string } | { resource: 'arenas'; offset: number } | { resource: 'arena'; slug: string } | { resource: 'profile' } | { resource: 'account' } | { resource: 'sports' } | { resource: 'feed'; offset: number; arenaId?: string } | { resource: 'comments'; postId: string; offset: number };
export type ReadData =
  | { kind: 'arenas'; arenas: ReadArena[]; sports: ReadSport[]; hasMore: boolean; offset: number }
  | { kind: 'arena'; arena: ReadArena }
  | { kind: 'profile'; profile: ReadProfile }
  | { kind: 'account'; viewerId: string; deletionPending: boolean; blocks: { blocked_id: string; blocked_name: string }[]; reports: { id: string; reason: string; status: string; created_at: string }[]; media: { path: string; bucket: string; ready: boolean; inUse: boolean }[] }
  | { kind: 'discover'; players: DiscoveryRow[]; hasMore: boolean }
  | { kind: 'player'; profile: ReadProfile; own: boolean; connected: boolean }
  | { kind: 'feed'; posts: FeedRow[]; hasMore: boolean; viewerId: string }
  | { kind: 'comments'; comments: ReadComment[]; hasMore: boolean; viewerId: string }
  | { kind: 'sports'; sports: ReadSport[] };
export type ReadErrorCode = 'configuration' | 'authentication' | 'profile_missing' | 'not_found' | 'unavailable' | 'invalid_request';
export type ReadResponse = { status: 'success'; data: ReadData } | { status: 'demo' } | { status: 'error'; code: ReadErrorCode; message: string };

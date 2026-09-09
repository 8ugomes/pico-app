import type { FeedRow } from './database';
import type { Level, SportId } from './social';
export type ReadSport = { id: string; slug: SportId; name: string };
export type ReadArena = {
  id: string; slug: string; name: string; description: string;
  neighborhood: string; city: string; image: string | null; isDemo: boolean;
  sports: ReadSport[];
};
export type ReadProfile = {
  id: string; username: string; name: string; bio: string; city: string;
  neighborhood: string; available: boolean; isDemo: boolean; onboardingCompleted: boolean;
  sports: { sport: ReadSport; level: Level; isPrimary: boolean }[];
};
export type ReadPresence = { id: string; playerId: string; name: string; username: string; arena: { id: string; name: string; slug: string }; sport: ReadSport; expiresAt: string };
export type ReadComment = { id: string; body: string; createdAt: string; name: string; username: string };
export type ReadRequest = { resource: 'arenas'; offset: number } | { resource: 'arena'; slug: string } | { resource: 'profile' } | { resource: 'sports' } | { resource: 'feed'; offset: number; arenaId?: string } | { resource: 'comments'; postId: string; offset: number } | { resource: 'checkin'; arenaId?: string };
export type ReadData =
  | { kind: 'arenas'; arenas: ReadArena[]; sports: ReadSport[]; hasMore: boolean; offset: number }
  | { kind: 'arena'; arena: ReadArena }
  | { kind: 'profile'; profile: ReadProfile }
  | { kind: 'feed'; posts: FeedRow[]; hasMore: boolean; viewerId: string }
  | { kind: 'comments'; comments: ReadComment[]; hasMore: boolean }
  | { kind: 'sports'; sports: ReadSport[] }
  | { kind: 'checkin'; own: ReadPresence | null; presence: ReadPresence[] };
export type ReadErrorCode = 'configuration' | 'authentication' | 'profile_missing' | 'not_found' | 'unavailable' | 'invalid_request';
export type ReadResponse = { status: 'success'; data: ReadData } | { status: 'demo' } | { status: 'error'; code: ReadErrorCode; message: string };

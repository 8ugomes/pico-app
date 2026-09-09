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
export type ReadRequest = { resource: 'arenas'; offset: number } | { resource: 'arena'; slug: string } | { resource: 'profile' };
export type ReadData =
  | { kind: 'arenas'; arenas: ReadArena[]; sports: ReadSport[]; hasMore: boolean; offset: number }
  | { kind: 'arena'; arena: ReadArena }
  | { kind: 'profile'; profile: ReadProfile };
export type ReadErrorCode = 'configuration' | 'authentication' | 'profile_missing' | 'not_found' | 'unavailable' | 'invalid_request';
export type ReadResponse = { status: 'success'; data: ReadData } | { status: 'demo' } | { status: 'error'; code: ReadErrorCode; message: string };

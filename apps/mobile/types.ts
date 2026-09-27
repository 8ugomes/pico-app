export type Loadable<T> =
  | { status: 'idle' | 'loading'; data: T | null; message: '' }
  | { status: 'ready'; data: T; message: '' }
  | { status: 'error'; data: T | null; message: string };

export type SessionUser = { id: string; email: string | null };

export type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: SessionUser;
};

export type Capabilities = {
  apiVersion: string;
  currentClientVersion: string;
  minimumClientVersion: string;
  features: {
    accountDeletion: boolean;
    accountExport: boolean;
    communities: boolean;
    games: boolean;
    privateMedia: boolean;
    videoPublishing: boolean;
  };
};

export type Sport = { id: string; slug: string; name: string };

export type Profile = {
  id: string;
  username: string;
  name: string;
  bio: string;
  city: string;
  neighborhood: string;
  available: boolean;
  avatar: string | null;
  avatarPath: string | null;
  isDemo: boolean;
  onboardingCompleted: boolean;
  sports: { sport: Sport; level: 'Iniciante' | 'Intermediário' | 'Avançado'; isPrimary: boolean }[];
};

export type Arena = {
  id: string;
  slug: string;
  name: string;
  description: string;
  neighborhood: string;
  city: string;
  image: string | null;
  video: string | null;
  isDemo: boolean;
  sports: Sport[];
  directory?: { address: string; region: string; note: string; sourceUrl: string; checkedOn: string };
};

export type Player = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  city: string;
  neighborhood: string;
  is_demo: boolean;
  sport_name: string | null;
  sport_slug: string | null;
  level: string | null;
  connected: boolean;
  avatar: string | null;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  entry_mode: 'open' | 'approval' | 'invite';
  visibility: 'beta' | 'private';
  membership: string | null;
  description: string | null;
  arena_name?: string;
  is_official?: boolean;
  pico_official?: boolean;
};

export type Post = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  username: string;
  display_name: string;
  arena_id: string | null;
  arena_name: string | null;
  sport_id: string | null;
  sport_name: string | null;
  like_count: number;
  comment_count: number;
  liked: boolean;
  reposted: boolean;
  can_repost: boolean;
  image: string | null;
  video: string | null;
  avatar: string | null;
  audience: 'beta' | 'private';
};

export type PublicationOptions = {
  arenas: { id: string; slug: string; name: string }[];
  communities: { id: string; slug: string; name: string; visibility: 'beta' | 'private' }[];
};

export type PlayedGame = {
  id: string;
  arena_id: string;
  arena_slug: string;
  arena_name: string;
  sport_id: string;
  sport_name: string;
  played_on: string;
  version: number;
};

export type AccountData = {
  viewerId: string;
  deletionPending: boolean;
  blocks: { blocked_id: string; blocked_name: string }[];
  reports: { id: string; reason: string; status: string; created_at: string }[];
  media: { path: string; bucket: string; ready: boolean; inUse: boolean }[];
};

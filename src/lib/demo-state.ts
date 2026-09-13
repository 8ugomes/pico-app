import type { DemoSeed, DemoState, SportId, Player } from "../types/social";

import { validGameDate } from "./game-date.ts";
export type PostInput = { arenaId: string; sportId: SportId; content: string; communityIds?: string[]; audience?: "beta" | "private"; distributedToArena?: boolean; gameId?: string; gameVersion?: number; photo?: string };
export type ProfileInput = Pick<Player, "name" | "bio" | "available">;
export type DemoAction =
  | { type: "like"; postId: string }
  | { type: "repost"; postId: string; reposted: boolean; now: number }
  | { type: "connect"; playerId: string }
  | { type: "follow"; arenaId: string }
  | { type: "post"; input: PostInput; id: string; now: number }
  | { type: "comment"; postId: string; content: string; id: string; now: number }
  | { type: "save_game"; arenaId: string; sportId: SportId; id: string; playedOn: string; version?: number }
  | { type: "delete_game"; id: string }
  | { type: "community_membership"; id: string; join: boolean }
  | { type: "profile"; input: ProfileInput };

export function createDemoState(seed: DemoSeed): DemoState {
  return { ...structuredClone(seed), reposts: [], deletedGameIds: [], likedPostIds: [], connectedPlayerIds: ["marina", "lucas"], followedArenaIds: [...(seed.players.find(p => p.id === seed.currentUserId)?.arenaIds ?? [])] };
}
function toggle(items: string[], id: string) { return items.includes(id) ? items.filter(item => item !== id) : [...items, id]; }
export function validArenaSport(state: DemoState, arenaId: string, sportId: SportId) {
  return Boolean(state.arenas.find(a => a.id === arenaId)?.sports.includes(sportId));
}
export function validatePost(state: DemoState, input: PostInput) {
  if (!validArenaSport(state, input.arenaId, input.sportId)) return "Escolha uma arena e um esporte praticado nela.";
  if (input.gameId) {
    const game = state.games.find(g => g.id === input.gameId && g.playerId === state.currentUserId);
    if (!game || game.version !== input.gameVersion || game.arenaId !== input.arenaId || game.sportId !== input.sportId) return "Confira a versão atual do seu jogo antes de compartilhar.";
  }
  const groups = input.communityIds ?? [];
  if (groups.length > 5 || groups.some(id => !state.communities.some(c => c.id === id && c.members.includes(state.currentUserId) && c.visibility === (input.audience ?? 'beta')))) return "Escolha uma comunidade de que você participa.";
  if (input.audience === 'private' && (groups.length !== 1 || input.distributedToArena)) return "Escolha apenas uma comunidade privada.";
  if (input.distributedToArena && !state.followedArenaIds.includes(input.arenaId)) return "Acompanhe a arena antes de publicar no mural.";
  if (!input.content.trim() && !input.gameId) return "Escreva algo para compartilhar com a turma.";
  if (input.content.trim().length > 500) return "Seu post pode ter até 500 caracteres.";
  return null;
}
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "repost": {
      const previous = state.reposts.some(r => r.postId === action.postId && r.playerId === state.currentUserId);
      if (action.reposted === previous) return state;
      if (action.reposted && !visibleDemoPosts(state).some(p => p.id === action.postId && p.authorId !== state.currentUserId)) return state;
      return { ...state, reposts: action.reposted
        ? [...state.reposts, { postId: action.postId, playerId: state.currentUserId, createdAt: action.now }]
        : state.reposts.filter(r => r.postId !== action.postId || r.playerId !== state.currentUserId) };
    }
    case "like": return state.posts.some(p => p.id === action.postId) ? { ...state, likedPostIds: toggle(state.likedPostIds, action.postId) } : state;
    case "connect": return action.playerId !== state.currentUserId && state.players.some(p => p.id === action.playerId) ? { ...state, connectedPlayerIds: toggle(state.connectedPlayerIds, action.playerId) } : state;
    case "follow": return state.arenas.some(a => a.id === action.arenaId) ? { ...state, followedArenaIds: toggle(state.followedArenaIds, action.arenaId) } : state;
    case "post":
      if (validatePost(state, action.input) || state.posts.some(p => p.id === action.id)) return state;
      return { ...state, posts: [{ ...action.input, content: action.input.content.trim() || `Joguei em ${state.arenas.find(a => a.id === action.input.arenaId)?.name} em ${state.games.find(g => g.id === action.input.gameId)?.playedOn}.`, gamePlayedOn: state.games.find(g => g.id === action.input.gameId)?.playedOn, id: action.id, authorId: state.currentUserId, createdAt: action.now, likes: 0 }, ...state.posts] };
    case "comment":
      if (!state.posts.some(p => p.id === action.postId) || !action.content.trim() || action.content.trim().length > 280 || state.comments.some(c => c.id === action.id)) return state;
      return { ...state, comments: [...state.comments, { id: action.id, postId: action.postId, authorId: state.currentUserId, content: action.content.trim(), createdAt: action.now }] };
    case "save_game": {
      if (state.deletedGameIds.includes(action.id) || !validArenaSport(state, action.arenaId, action.sportId) || !validGameDate(action.playedOn)) return state;
      const old = state.games.find(g => g.id === action.id);
      if (!old && action.version !== undefined) return state;
      if (old && (old.playerId !== state.currentUserId || (action.version !== old.version && (old.arenaId !== action.arenaId || old.sportId !== action.sportId || old.playedOn !== action.playedOn)))) return state;
      if (old && old.arenaId === action.arenaId && old.sportId === action.sportId && old.playedOn === action.playedOn) return state;
      const game = { id: action.id, playerId: state.currentUserId, arenaId: action.arenaId, sportId: action.sportId, playedOn: action.playedOn, createdAt: old?.createdAt ?? new Date().toISOString(), version: (old?.version ?? 0) + 1 };
      return { ...state, games: [game, ...state.games.filter(g => g.id !== action.id)] };
    }
    case "delete_game": return state.games.some(g => g.id === action.id && g.playerId === state.currentUserId) ? { ...state, deletedGameIds: [...state.deletedGameIds, action.id], games: state.games.filter(g => g.id !== action.id) } : state;
    case "community_membership": return { ...state, communities: state.communities.map(c => {
      if (c.id !== action.id) return c;
      if (!action.join) return { ...c, members: c.members.filter(id => id !== state.currentUserId), pending: c.pending.filter(id => id !== state.currentUserId) };
      if (c.members.includes(state.currentUserId) || c.pending.includes(state.currentUserId) || c.entryMode === 'invite') return c;
      return c.entryMode === 'approval' ? { ...c, pending: [...c.pending, state.currentUserId] } : { ...c, members: [...c.members, state.currentUserId] };
    }) };
    case "profile":
      if (action.input.name.trim().length < 2 || action.input.name.trim().length > 60 || action.input.bio.trim().length > 160) return state;
      return { ...state, players: state.players.map(p => p.id === state.currentUserId ? { ...p, ...action.input, name: action.input.name.trim(), bio: action.input.bio.trim() } : p) };
  }
}
export function normalizeSearch(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
export function timeAgo(createdAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.floor(minutes / 60)} h`;
}

export function visibleDemoPosts(state: DemoState) {
  return state.posts.filter(p => p.audience !== 'private' || p.communityIds?.some(id => state.communities.some(c => c.id === id && c.members.includes(state.currentUserId))));
}

export function demoFeed(state: DemoState, authorId?: string, followingOnly = false) {
  return visibleDemoPosts(state).map(post => {
    const repost = state.reposts.filter(r => r.postId === post.id && r.playerId !== post.authorId
      && state.players.some(p => p.id === r.playerId)
      && (post.audience !== 'private' || state.communities.some(c => post.communityIds?.includes(c.id) && c.members.includes(r.playerId)))
      && (authorId ? r.playerId === authorId : r.playerId === state.currentUserId || state.connectedPlayerIds.includes(r.playerId)))
      .sort((a, b) => b.createdAt - a.createdAt || b.playerId.localeCompare(a.playerId))[0];
    return { post, repost };
  }).filter(({ post, repost }) => authorId ? post.authorId === authorId || repost
    : !followingOnly || post.authorId === state.currentUserId || state.connectedPlayerIds.includes(post.authorId) || repost)
    .sort((a, b) => Math.max(b.post.createdAt, b.repost?.createdAt ?? 0) - Math.max(a.post.createdAt, a.repost?.createdAt ?? 0) || b.post.id.localeCompare(a.post.id));
}

import type { DemoSeed, DemoState, SportId, Player } from "../types/social";

export const CHECKIN_DURATION = 2 * 60 * 60 * 1000;
export type PostInput = { arenaId: string; sportId: SportId; content: string };
export type ProfileInput = Pick<Player, "name" | "bio" | "available">;
export type DemoAction =
  | { type: "like"; postId: string }
  | { type: "connect"; playerId: string }
  | { type: "follow"; arenaId: string }
  | { type: "post"; input: PostInput; id: string; now: number }
  | { type: "comment"; postId: string; content: string; id: string; now: number }
  | { type: "checkin"; arenaId: string; sportId: SportId; id: string; now: number }
  | { type: "checkout" }
  | { type: "profile"; input: ProfileInput };

export function createDemoState(seed: DemoSeed): DemoState {
  return { ...structuredClone(seed), likedPostIds: [], connectedPlayerIds: ["marina", "lucas"], followedArenaIds: [...(seed.players.find(p => p.id === seed.currentUserId)?.arenaIds ?? [])] };
}
function toggle(items: string[], id: string) { return items.includes(id) ? items.filter(item => item !== id) : [...items, id]; }
export function activeCheckins(state: DemoState, now: number) {
  return state.checkins.filter(c => c.startedAt <= now && c.expiresAt > now);
}
export function validArenaSport(state: DemoState, arenaId: string, sportId: SportId) {
  return Boolean(state.arenas.find(a => a.id === arenaId)?.sports.includes(sportId));
}
export function validatePost(state: DemoState, input: PostInput) {
  if (!validArenaSport(state, input.arenaId, input.sportId)) return "Escolha uma arena e um esporte praticado nela.";
  if (!input.content.trim()) return "Escreva algo para compartilhar com a turma.";
  if (input.content.trim().length > 500) return "Seu post pode ter até 500 caracteres.";
  return null;
}
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "like": return state.posts.some(p => p.id === action.postId) ? { ...state, likedPostIds: toggle(state.likedPostIds, action.postId) } : state;
    case "connect": return action.playerId !== state.currentUserId && state.players.some(p => p.id === action.playerId) ? { ...state, connectedPlayerIds: toggle(state.connectedPlayerIds, action.playerId) } : state;
    case "follow": return state.arenas.some(a => a.id === action.arenaId) ? { ...state, followedArenaIds: toggle(state.followedArenaIds, action.arenaId) } : state;
    case "post":
      if (validatePost(state, action.input) || state.posts.some(p => p.id === action.id)) return state;
      return { ...state, posts: [{ ...action.input, content: action.input.content.trim(), id: action.id, authorId: state.currentUserId, createdAt: action.now, likes: 0 }, ...state.posts] };
    case "comment":
      if (!state.posts.some(p => p.id === action.postId) || !action.content.trim() || action.content.trim().length > 280 || state.comments.some(c => c.id === action.id)) return state;
      return { ...state, comments: [...state.comments, { id: action.id, postId: action.postId, authorId: state.currentUserId, content: action.content.trim(), createdAt: action.now }] };
    case "checkin":
      if (!validArenaSport(state, action.arenaId, action.sportId)) return state;
      return { ...state, checkins: [...state.checkins.filter(c => c.playerId !== state.currentUserId), { id: action.id, playerId: state.currentUserId, arenaId: action.arenaId, sportId: action.sportId, startedAt: action.now, expiresAt: action.now + CHECKIN_DURATION }] };
    case "checkout": return { ...state, checkins: state.checkins.filter(c => c.playerId !== state.currentUserId) };
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

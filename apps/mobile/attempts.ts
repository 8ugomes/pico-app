import { Preferences } from '@capacitor/preferences';
import type { DraftStorage } from './drafts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CommentAttempt = {
  key: string;
  postId: string;
  body: string;
};

export type GameShareAttempt = {
  key: string;
  gameId: string;
  gameVersion: number;
  body: string;
  audience: 'beta' | 'private';
  wallArena: string;
  groups: string[];
};

function accountKey(prefix: string, accountId: string) {
  if (!UUID.test(accountId)) throw new Error('Identificador da conta inválido.');
  return `${prefix}.${accountId}`;
}

function commentKey(accountId: string) {
  return accountKey('pico.mobile.comment-attempts.v1', accountId);
}

function gameShareKey(accountId: string) {
  return accountKey('pico.mobile.game-share-attempts.v1', accountId);
}

function parseComment(raw: string | null): CommentAttempt | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CommentAttempt>;
    return UUID.test(value.key || '') && UUID.test(value.postId || '') && typeof value.body === 'string' && value.body.length <= 280
      ? value as CommentAttempt
      : null;
  } catch {
    return null;
  }
}

function parseGameShare(raw: string | null): GameShareAttempt | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<GameShareAttempt>;
    if (!UUID.test(value.key || '') || !UUID.test(value.gameId || '') || !Number.isInteger(value.gameVersion) || (value.gameVersion || 0) < 1) return null;
    if (typeof value.body !== 'string' || value.body.length > 500 || (value.audience !== 'beta' && value.audience !== 'private')) return null;
    if (typeof value.wallArena !== 'string' || (value.wallArena && !UUID.test(value.wallArena))) return null;
    if (!Array.isArray(value.groups) || value.groups.length > 5 || value.groups.some((id) => !UUID.test(id))) return null;
    return value as GameShareAttempt;
  } catch {
    return null;
  }
}

export function createAttemptRepository(storage: DraftStorage = Preferences) {
  return {
    async comment(accountId: string, postId: string, body: string) {
      const storageKey = commentKey(accountId);
      const current = parseComment((await storage.get({ key: storageKey })).value);
      if (current?.postId === postId && current.body === body) return current;
      const next = { key: crypto.randomUUID(), postId, body };
      await storage.set({ key: storageKey, value: JSON.stringify(next) });
      return next;
    },
    async confirmComment(accountId: string, key: string) {
      const storageKey = commentKey(accountId);
      const current = parseComment((await storage.get({ key: storageKey })).value);
      if (!current || current.key !== key) return false;
      await storage.remove({ key: storageKey });
      return true;
    },
    async loadGameShare(accountId: string, gameId: string, gameVersion: number) {
      const current = parseGameShare((await storage.get({ key: gameShareKey(accountId) })).value);
      return current?.gameId === gameId && current.gameVersion === gameVersion ? current : null;
    },
    async saveGameShare(accountId: string, value: GameShareAttempt) {
      const safe = parseGameShare(JSON.stringify(value));
      if (!safe) throw new Error('Tentativa de compartilhamento inválida.');
      await storage.set({ key: gameShareKey(accountId), value: JSON.stringify(safe) });
    },
    async confirmGameShare(accountId: string, key: string) {
      const storageKey = gameShareKey(accountId);
      const current = parseGameShare((await storage.get({ key: storageKey })).value);
      if (!current || current.key !== key) return false;
      await storage.remove({ key: storageKey });
      return true;
    },
  };
}

export const attempts = createAttemptRepository();

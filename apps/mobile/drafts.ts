import { Preferences } from '@capacitor/preferences';

export type DraftKind = 'publication' | 'game' | 'profile';

export type PublicationDraft = {
  idempotencyKey: string;
  body: string;
  audience: 'beta' | 'private';
  wallArena: string;
  groups: string[];
  mediaKind: 'photo' | 'video';
  imagePath: string | null;
  videoPath: string | null;
};

export type GameDraft = {
  idempotencyKey: string;
  arenaId: string;
  sportId: string;
  playedOn: string;
};

export type ProfileDraft = {
  avatarPath: string | null;
  name: string;
  username: string;
  bio: string;
  city: string;
  neighborhood: string;
  sportId: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
};

type DraftValue = PublicationDraft | GameDraft | ProfileDraft;

type DraftEnvelope = {
  version: 1;
  accountId: string;
  kind: DraftKind;
  updatedAt: string;
  value: DraftValue;
};

export type DraftStorage = {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PREFIX = 'pico.mobile.draft.v1';

function requireUuid(value: string, label: string) {
  if (!UUID.test(value)) throw new Error(`${label} inválido para o rascunho.`);
  return value;
}

export function draftStorageKey(accountId: string, kind: DraftKind) {
  return `${PREFIX}.${requireUuid(accountId, 'Identificador da conta')}.${kind}`;
}

function publicationValue(value: PublicationDraft): PublicationDraft {
  requireUuid(value.idempotencyKey, 'Identificador da publicação');
  if (typeof value.body !== 'string' || value.body.length > 500) throw new Error('Texto inválido para o rascunho.');
  if (value.audience !== 'beta' && value.audience !== 'private') throw new Error('Audiência inválida para o rascunho.');
  if (typeof value.wallArena !== 'string' || (value.wallArena && !UUID.test(value.wallArena))) throw new Error('Arena inválida para o rascunho.');
  if (!Array.isArray(value.groups) || value.groups.length > 5 || value.groups.some((item) => !UUID.test(item))) throw new Error('Comunidades inválidas para o rascunho.');
  const mediaKind = value.mediaKind === 'video' ? 'video' : 'photo';
  if (value.imagePath !== null && (typeof value.imagePath !== 'string' || value.imagePath.length > 512)) throw new Error('Foto inválida para o rascunho.');
  const videoPath = value.videoPath ?? null;
  if (videoPath !== null && (typeof videoPath !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.mp4$/.test(videoPath))) throw new Error('Vídeo inválido para o rascunho.');
  return {
    idempotencyKey: value.idempotencyKey,
    body: value.body,
    audience: value.audience,
    wallArena: value.wallArena,
    groups: [...value.groups],
    mediaKind,
    imagePath: value.imagePath,
    videoPath,
  };
}

function gameValue(value: GameDraft): GameDraft {
  requireUuid(value.idempotencyKey, 'Identificador do jogo');
  if (value.arenaId && !UUID.test(value.arenaId)) throw new Error('Arena inválida para o rascunho.');
  if (value.sportId && !UUID.test(value.sportId)) throw new Error('Modalidade inválida para o rascunho.');
  if (!DATE.test(value.playedOn)) throw new Error('Data inválida para o rascunho.');
  return {
    idempotencyKey: value.idempotencyKey,
    arenaId: value.arenaId,
    sportId: value.sportId,
    playedOn: value.playedOn,
  };
}

function profileValue(value: ProfileDraft): ProfileDraft {
  if (value.avatarPath !== null && (typeof value.avatarPath !== 'string' || value.avatarPath.length > 512)) throw new Error('Foto inválida para o rascunho.');
  if (typeof value.name !== 'string' || value.name.length > 60) throw new Error('Nome inválido para o rascunho.');
  if (typeof value.username !== 'string' || value.username.length > 40) throw new Error('Usuário inválido para o rascunho.');
  if (typeof value.bio !== 'string' || value.bio.length > 160) throw new Error('Apresentação inválida para o rascunho.');
  if (typeof value.city !== 'string' || value.city.length > 80 || typeof value.neighborhood !== 'string' || value.neighborhood.length > 80) throw new Error('Local inválido para o rascunho.');
  if (value.sportId && !UUID.test(value.sportId)) throw new Error('Modalidade inválida para o rascunho.');
  if (!['Iniciante', 'Intermediário', 'Avançado'].includes(value.level)) throw new Error('Nível inválido para o rascunho.');
  return {
    avatarPath: value.avatarPath,
    name: value.name,
    username: value.username,
    bio: value.bio,
    city: value.city,
    neighborhood: value.neighborhood,
    sportId: value.sportId,
    level: value.level,
  };
}

function parseEnvelope(raw: string | null, accountId: string, kind: DraftKind) {
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as Partial<DraftEnvelope>;
    if (envelope.version !== 1 || envelope.accountId !== accountId || envelope.kind !== kind || !envelope.value) return null;
    return kind === 'publication'
      ? publicationValue(envelope.value as PublicationDraft)
      : kind === 'game'
        ? gameValue(envelope.value as GameDraft)
        : profileValue(envelope.value as ProfileDraft);
  } catch {
    return null;
  }
}

export function createDraftRepository(storage: DraftStorage = Preferences) {
  const pending = new Map<string, Promise<unknown>>();

  function enqueue<T>(key: string, operation: () => Promise<T>) {
    const previous = pending.get(key) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    pending.set(key, current);
    return current.finally(() => {
      if (pending.get(key) === current) pending.delete(key);
    });
  }

  async function load<T extends DraftValue>(accountId: string, kind: DraftKind) {
    const key = draftStorageKey(accountId, kind);
    await pending.get(key)?.catch(() => undefined);
    const { value } = await storage.get({ key });
    return parseEnvelope(value, accountId, kind) as T | null;
  }

  function save(accountId: string, kind: DraftKind, value: DraftValue) {
    const key = draftStorageKey(accountId, kind);
    const safeValue = kind === 'publication'
      ? publicationValue(value as PublicationDraft)
      : kind === 'game'
        ? gameValue(value as GameDraft)
        : profileValue(value as ProfileDraft);
    const envelope: DraftEnvelope = {
      version: 1,
      accountId,
      kind,
      updatedAt: new Date().toISOString(),
      value: safeValue,
    };
    return enqueue(key, () => storage.set({ key, value: JSON.stringify(envelope) }));
  }

  function confirm(accountId: string, kind: DraftKind, idempotencyKey: string) {
    requireUuid(idempotencyKey, 'Identificador da tentativa');
    const key = draftStorageKey(accountId, kind);
    return enqueue(key, async () => {
      const { value } = await storage.get({ key });
      const current = parseEnvelope(value, accountId, kind);
      if (!current || !('idempotencyKey' in current) || current.idempotencyKey !== idempotencyKey) return false;
      await storage.remove({ key });
      return true;
    });
  }

  return {
    loadPublication: (accountId: string) => load<PublicationDraft>(accountId, 'publication'),
    savePublication: (accountId: string, value: PublicationDraft) => save(accountId, 'publication', value),
    confirmPublication: (accountId: string, idempotencyKey: string) => confirm(accountId, 'publication', idempotencyKey),
    loadGame: (accountId: string) => load<GameDraft>(accountId, 'game'),
    saveGame: (accountId: string, value: GameDraft) => save(accountId, 'game', value),
    confirmGame: (accountId: string, idempotencyKey: string) => confirm(accountId, 'game', idempotencyKey),
    loadProfile: (accountId: string) => load<ProfileDraft>(accountId, 'profile'),
    saveProfile: (accountId: string, value: ProfileDraft) => save(accountId, 'profile', value),
    clearProfile: (accountId: string) => enqueue(draftStorageKey(accountId, 'profile'), () => storage.remove({ key: draftStorageKey(accountId, 'profile') })),
  };
}

export const drafts = createDraftRepository();

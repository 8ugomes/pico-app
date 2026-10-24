export const LOCAL_SPORTS = ['Futevôlei', 'Beach tennis', 'Vôlei de praia'] as const;

export type LocalSport = (typeof LOCAL_SPORTS)[number];

export type LocalProfileInput = {
  name: string;
  sport: LocalSport;
  city: string;
};

export type LocalArenaInput = {
  id: string;
  name: string;
  neighborhood?: string;
  city?: string;
};

export type LocalGameInput = {
  id: string;
  arenaId: string;
  sport: LocalSport;
  playedOn: string;
  notes?: string;
};

export type LocalArena = {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalGame = {
  id: string;
  arenaId: string | null;
  arenaSnapshot: string;
  sport: LocalSport;
  playedOn: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalWorkspace = {
  version: 1;
  updatedAt: string;
  profile: LocalProfileInput | null;
  arenas: LocalArena[];
  games: LocalGame[];
};

export type LocalWorkspaceErrorCode = 'corrupt' | 'future_version' | 'too_large';

export class LocalWorkspaceError extends Error {
  readonly code: LocalWorkspaceErrorCode;

  constructor(code: LocalWorkspaceErrorCode, message: string) {
    super(message);
    this.name = 'LocalWorkspaceError';
    this.code = code;
  }
}

type GameMutationContext = {
  now?: string;
  today?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T/;
const MAX_SERIALIZED_LENGTH = 1_000_000;
const MAX_ARENAS = 100;
const MAX_GAMES = 1_000;
const MAX_NAME = 60;
const MAX_CITY = 80;
const MAX_ARENA_NAME = 100;
const MAX_NEIGHBORHOOD = 80;
const MAX_NOTES = 500;
const MAX_ARENA_SNAPSHOT = 280;

const CORRUPT_WORKSPACE_MESSAGE = 'Os dados guardados neste iPhone não puderam ser abertos. Nada foi apagado.';
const FUTURE_WORKSPACE_MESSAGE = 'Este espaço local foi salvo por uma versão mais nova do Pico. Atualize o app para continuar. Nada foi apagado.';
const OVERSIZED_STORED_WORKSPACE_MESSAGE = 'Os dados guardados neste iPhone ultrapassam o limite desta versão. Nada foi apagado.';
const OVERSIZED_WORKSPACE_MESSAGE = 'O espaço local atingiu o limite desta versão. Remova alguns jogos ou arenas antes de salvar.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown, label: string, maximum: number, required = false) {
  if (typeof value !== 'string') throw new Error(`${label} inválido.`);
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maximum) throw new Error(`${label} inválido.`);
  return normalized;
}

function normalizeId(value: unknown, label = 'Identificador') {
  if (typeof value !== 'string' || !UUID.test(value)) throw new Error(`${label} inválido.`);
  return value.toLowerCase();
}

function normalizeSport(value: unknown): LocalSport {
  if (typeof value !== 'string' || !LOCAL_SPORTS.includes(value as LocalSport)) throw new Error('Modalidade inválida.');
  return value as LocalSport;
}

function normalizeCalendarDate(value: unknown, label: string) {
  if (typeof value !== 'string') throw new Error(`${label} inválida.`);
  const match = DATE.exec(value);
  if (!match) throw new Error(`${label} inválida.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`${label} inválida.`);
  }
  return value;
}

function localToday(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizePlayedOn(value: unknown, today: string) {
  const normalizedToday = normalizeCalendarDate(today, 'Data atual');
  const playedOn = normalizeCalendarDate(value, 'Data do jogo');
  if (playedOn > normalizedToday) throw new Error('A data do jogo não pode ser futura.');
  return playedOn;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== 'string' || !ISO_TIMESTAMP.test(value)) throw new Error('Horário local inválido.');
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) throw new Error('Horário local inválido.');
  return timestamp.toISOString();
}

function mutationTimestamp(value?: string) {
  return normalizeTimestamp(value ?? new Date().toISOString());
}

function normalizeProfile(value: unknown): LocalProfileInput {
  if (!isRecord(value)) throw new Error('Perfil local inválido.');
  return {
    name: normalizeText(value.name, 'Nome', MAX_NAME, true),
    sport: normalizeSport(value.sport),
    city: normalizeText(value.city, 'Cidade', MAX_CITY),
  };
}

function normalizeArenaInput(value: unknown) {
  if (!isRecord(value)) throw new Error('Arena local inválida.');
  return {
    id: normalizeId(value.id),
    name: normalizeText(value.name, 'Nome da arena', MAX_ARENA_NAME, true),
    neighborhood: normalizeText(value.neighborhood ?? '', 'Bairro', MAX_NEIGHBORHOOD),
    city: normalizeText(value.city ?? '', 'Cidade', MAX_CITY),
  };
}

function normalizeStoredArena(value: unknown): LocalArena {
  const arena = normalizeArenaInput(value);
  if (!isRecord(value)) throw new Error('Arena local inválida.');
  return {
    ...arena,
    createdAt: normalizeTimestamp(value.createdAt),
    updatedAt: normalizeTimestamp(value.updatedAt),
  };
}

function normalizeStoredGame(value: unknown): LocalGame {
  if (!isRecord(value)) throw new Error('Jogo local inválido.');
  const arenaId = value.arenaId === null ? null : normalizeId(value.arenaId, 'Identificador da arena');
  return {
    id: normalizeId(value.id),
    arenaId,
    arenaSnapshot: normalizeText(value.arenaSnapshot, 'Referência histórica da arena', MAX_ARENA_SNAPSHOT, true),
    sport: normalizeSport(value.sport),
    playedOn: normalizeCalendarDate(value.playedOn, 'Data do jogo'),
    notes: normalizeText(value.notes ?? '', 'Observação', MAX_NOTES),
    createdAt: normalizeTimestamp(value.createdAt),
    updatedAt: normalizeTimestamp(value.updatedAt),
  };
}

function normalizeWorkspace(value: unknown): LocalWorkspace {
  if (!isRecord(value) || value.version !== 1) throw new Error('Versão do espaço local incompatível.');
  if (!Array.isArray(value.arenas) || value.arenas.length > MAX_ARENAS) throw new Error('Lista de arenas local inválida.');
  if (!Array.isArray(value.games) || value.games.length > MAX_GAMES) throw new Error('Lista de jogos local inválida.');

  const profile = value.profile === null ? null : normalizeProfile(value.profile);
  const arenas = value.arenas.map(normalizeStoredArena);
  const arenaIds = new Set<string>();
  for (const arena of arenas) {
    if (arenaIds.has(arena.id)) throw new Error('Arena local duplicada.');
    arenaIds.add(arena.id);
  }

  const games = value.games.map(normalizeStoredGame);
  const gameIds = new Set<string>();
  for (const game of games) {
    if (gameIds.has(game.id)) throw new Error('Jogo local duplicado.');
    if (game.arenaId !== null && !arenaIds.has(game.arenaId)) throw new Error('Arena do jogo local não encontrada.');
    gameIds.add(game.id);
  }

  if (profile === null && (arenas.length > 0 || games.length > 0)) throw new Error('Espaço local sem perfil configurado.');

  return {
    version: 1,
    updatedAt: normalizeTimestamp(value.updatedAt),
    profile,
    arenas,
    games,
  };
}

function requireWorkspace(workspace: LocalWorkspace) {
  return normalizeWorkspace(workspace);
}

function requireConfigured(workspace: LocalWorkspace) {
  const current = requireWorkspace(workspace);
  if (!current.profile) throw new Error('Configure o perfil local antes de continuar.');
  return current;
}

function arenaSnapshot(arena: LocalArena) {
  return [arena.name, arena.neighborhood, arena.city].filter(Boolean).join(', ');
}

function replaceWorkspace(
  workspace: LocalWorkspace,
  values: Partial<Pick<LocalWorkspace, 'profile' | 'arenas' | 'games'>>,
  now?: string,
): LocalWorkspace {
  return {
    version: 1,
    updatedAt: mutationTimestamp(now),
    profile: values.profile === undefined ? workspace.profile : values.profile,
    arenas: values.arenas === undefined ? workspace.arenas : values.arenas,
    games: values.games === undefined ? workspace.games : values.games,
  };
}

export function createLocalWorkspace(now?: string): LocalWorkspace {
  return {
    version: 1,
    updatedAt: mutationTimestamp(now),
    profile: null,
    arenas: [],
    games: [],
  };
}

export function setupLocalProfile(workspace: LocalWorkspace, input: LocalProfileInput, now?: string) {
  const current = requireWorkspace(workspace);
  return replaceWorkspace(current, { profile: normalizeProfile(input) }, now);
}

export function createLocalArena(workspace: LocalWorkspace, input: LocalArenaInput, now?: string) {
  const current = requireConfigured(workspace);
  if (current.arenas.length >= MAX_ARENAS) throw new Error('Limite de arenas locais atingido.');
  const arena = normalizeArenaInput(input);
  if (current.arenas.some((item) => item.id === arena.id)) throw new Error('Esta arena local já existe.');
  const timestamp = mutationTimestamp(now);
  return replaceWorkspace(current, {
    arenas: [...current.arenas, { ...arena, createdAt: timestamp, updatedAt: timestamp }],
  }, timestamp);
}

export function updateLocalArena(
  workspace: LocalWorkspace,
  arenaId: string,
  patch: Partial<Omit<LocalArenaInput, 'id'>>,
  now?: string,
) {
  const current = requireConfigured(workspace);
  const id = normalizeId(arenaId);
  const index = current.arenas.findIndex((arena) => arena.id === id);
  if (index < 0) throw new Error('Arena local não encontrada.');
  const previous = current.arenas[index];
  const normalized = normalizeArenaInput({
    id,
    name: patch.name ?? previous.name,
    neighborhood: patch.neighborhood ?? previous.neighborhood,
    city: patch.city ?? previous.city,
  });
  const timestamp = mutationTimestamp(now);
  const arenas = current.arenas.map((arena, arenaIndex) => arenaIndex === index
    ? { ...normalized, createdAt: previous.createdAt, updatedAt: timestamp }
    : arena);
  return replaceWorkspace(current, { arenas }, timestamp);
}

export function deleteLocalArena(workspace: LocalWorkspace, arenaId: string, now?: string) {
  const current = requireConfigured(workspace);
  const id = normalizeId(arenaId);
  if (!current.arenas.some((arena) => arena.id === id)) throw new Error('Arena local não encontrada.');
  const timestamp = mutationTimestamp(now);
  const games = current.games.map((game) => game.arenaId === id
    ? { ...game, arenaId: null, updatedAt: timestamp }
    : game);
  return replaceWorkspace(current, {
    arenas: current.arenas.filter((arena) => arena.id !== id),
    games,
  }, timestamp);
}

export function createLocalGame(
  workspace: LocalWorkspace,
  input: LocalGameInput,
  context: GameMutationContext = {},
) {
  const current = requireConfigured(workspace);
  if (current.games.length >= MAX_GAMES) throw new Error('Limite de jogos locais atingido.');
  const id = normalizeId(input.id);
  if (current.games.some((game) => game.id === id)) throw new Error('Este jogo local já existe.');
  const selectedArenaId = normalizeId(input.arenaId, 'Identificador da arena');
  const arena = current.arenas.find((item) => item.id === selectedArenaId);
  if (!arena) throw new Error('Arena local não encontrada.');
  const timestamp = mutationTimestamp(context.now);
  const game: LocalGame = {
    id,
    arenaId: arena.id,
    arenaSnapshot: arenaSnapshot(arena),
    sport: normalizeSport(input.sport),
    playedOn: normalizePlayedOn(input.playedOn, context.today ?? localToday()),
    notes: normalizeText(input.notes ?? '', 'Observação', MAX_NOTES),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return replaceWorkspace(current, { games: [...current.games, game] }, timestamp);
}

export function updateLocalGame(
  workspace: LocalWorkspace,
  gameId: string,
  patch: Partial<Omit<LocalGameInput, 'id'>>,
  context: GameMutationContext = {},
) {
  const current = requireConfigured(workspace);
  const id = normalizeId(gameId);
  const index = current.games.findIndex((game) => game.id === id);
  if (index < 0) throw new Error('Jogo local não encontrado.');
  const previous = current.games[index];
  let selectedArenaId = previous.arenaId;
  let snapshot = previous.arenaSnapshot;
  if (patch.arenaId !== undefined) {
    selectedArenaId = normalizeId(patch.arenaId, 'Identificador da arena');
    const arena = current.arenas.find((item) => item.id === selectedArenaId);
    if (!arena) throw new Error('Arena local não encontrada.');
    if (selectedArenaId !== previous.arenaId) snapshot = arenaSnapshot(arena);
  }
  const timestamp = mutationTimestamp(context.now);
  const requestedPlayedOn = patch.playedOn ?? previous.playedOn;
  const game: LocalGame = {
    id,
    arenaId: selectedArenaId,
    arenaSnapshot: snapshot,
    sport: normalizeSport(patch.sport ?? previous.sport),
    playedOn: requestedPlayedOn === previous.playedOn
      ? normalizeCalendarDate(previous.playedOn, 'Data do jogo')
      : normalizePlayedOn(requestedPlayedOn, context.today ?? localToday()),
    notes: normalizeText(patch.notes ?? previous.notes, 'Observação', MAX_NOTES),
    createdAt: previous.createdAt,
    updatedAt: timestamp,
  };
  const games = current.games.map((item, gameIndex) => gameIndex === index ? game : item);
  return replaceWorkspace(current, { games }, timestamp);
}

export function deleteLocalGame(workspace: LocalWorkspace, gameId: string, now?: string) {
  const current = requireConfigured(workspace);
  const id = normalizeId(gameId);
  if (!current.games.some((game) => game.id === id)) throw new Error('Jogo local não encontrado.');
  return replaceWorkspace(current, { games: current.games.filter((game) => game.id !== id) }, now);
}

function isFutureWorkspace(value: unknown) {
  return isRecord(value)
    && typeof value.version === 'number'
    && Number.isInteger(value.version)
    && value.version > 1;
}

function parseStoredWorkspace(raw: string) {
  if (!raw) throw new LocalWorkspaceError('corrupt', CORRUPT_WORKSPACE_MESSAGE);
  if (raw.length > MAX_SERIALIZED_LENGTH) {
    throw new LocalWorkspaceError('too_large', OVERSIZED_STORED_WORKSPACE_MESSAGE);
  }

  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    throw new LocalWorkspaceError('corrupt', CORRUPT_WORKSPACE_MESSAGE);
  }

  if (isFutureWorkspace(value)) {
    throw new LocalWorkspaceError('future_version', FUTURE_WORKSPACE_MESSAGE);
  }

  try {
    return normalizeWorkspace(value);
  } catch {
    throw new LocalWorkspaceError('corrupt', CORRUPT_WORKSPACE_MESSAGE);
  }
}

export function parseLocalWorkspace(raw: unknown, _today?: string): LocalWorkspace | null {
  // Mantido na assinatura para leitores antigos; o relógio atual não redefine um fato já persistido.
  void _today;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return parseStoredWorkspace(raw);
  if (isFutureWorkspace(raw)) {
    throw new LocalWorkspaceError('future_version', FUTURE_WORKSPACE_MESSAGE);
  }

  const workspace = normalizeWorkspace(raw);
  if (JSON.stringify(workspace).length > MAX_SERIALIZED_LENGTH) {
    throw new LocalWorkspaceError('too_large', OVERSIZED_WORKSPACE_MESSAGE);
  }
  return workspace;
}

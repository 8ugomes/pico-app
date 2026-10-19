import { Preferences } from '@capacitor/preferences';
import { LocalWorkspaceError, createLocalWorkspace, parseLocalWorkspace, type LocalWorkspace } from './local-model.ts';
import { localWorkspaceStorage, type LocalWorkspaceStorage } from './local-workspace-storage.ts';

const LEGACY_LOCAL_WORKSPACE_KEY = 'pico.mobile.local.v1.workspace';
const LOCAL_MODE_KEY = 'pico.mobile.entry.v1.mode';
const LOCAL_MODE_VALUE = 'local';

type ModeStorage = Pick<typeof Preferences, 'get' | 'set' | 'remove'>;

type LocalRepositoryDependencies = {
  modeStorage?: ModeStorage;
  workspaceStorage?: LocalWorkspaceStorage;
};

function dayFromTimestamp(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : undefined;
}

function requireLocalWorkspace(raw: unknown, today?: string) {
  const workspace = parseLocalWorkspace(raw, today);
  if (!workspace) throw new Error('Os dados locais deste aparelho não puderam ser validados.');
  return workspace;
}

function storageErrorCode(cause: unknown) {
  if (typeof cause !== 'object' || cause === null || !('code' in cause)) return '';
  return typeof cause.code === 'string' ? cause.code : '';
}

function normalizeStorageError(cause: unknown): Error {
  const code = storageErrorCode(cause);
  if (code === 'LOCAL_WORKSPACE_CORRUPT') {
    return new LocalWorkspaceError('corrupt', 'Os dados guardados neste iPhone não puderam ser abertos. Nada foi apagado.');
  }
  if (code === 'LOCAL_WORKSPACE_TOO_LARGE') {
    return new LocalWorkspaceError('too_large', 'Os dados guardados neste iPhone ultrapassam o limite desta versão. Nada foi apagado.');
  }
  return cause instanceof Error ? cause : new Error('Não foi possível acessar os dados locais deste aparelho.');
}

async function ignoreLegacyCleanup(modeStorage: ModeStorage) {
  await modeStorage.remove({ key: LEGACY_LOCAL_WORKSPACE_KEY }).catch(() => undefined);
}

export function createLocalRepository({
  modeStorage = Preferences,
  workspaceStorage = localWorkspaceStorage,
}: LocalRepositoryDependencies = {}) {
  return {
    async isPreferred() {
      const { value } = await modeStorage.get({ key: LOCAL_MODE_KEY });
      return value === LOCAL_MODE_VALUE;
    },
    async prefer() {
      await modeStorage.set({ key: LOCAL_MODE_KEY, value: LOCAL_MODE_VALUE });
    },
    async leave() {
      await modeStorage.remove({ key: LOCAL_MODE_KEY });
    },
    async load(now?: string) {
      const persisted = await workspaceStorage.read().catch((cause: unknown) => {
        throw normalizeStorageError(cause);
      });
      if (persisted.value != null) {
        const workspace = requireLocalWorkspace(persisted.value, dayFromTimestamp(now));
        await ignoreLegacyCleanup(modeStorage);
        return workspace;
      }

      const legacy = await modeStorage.get({ key: LEGACY_LOCAL_WORKSPACE_KEY });
      if (legacy.value == null) return createLocalWorkspace(now);

      const workspace = requireLocalWorkspace(legacy.value, dayFromTimestamp(now));
      await workspaceStorage.write({ value: JSON.stringify(workspace) });
      await ignoreLegacyCleanup(modeStorage);
      return workspace;
    },
    async save(workspace: LocalWorkspace, today?: string) {
      const safe = requireLocalWorkspace(workspace, today);
      await ignoreLegacyCleanup(modeStorage);
      await workspaceStorage.write({ value: JSON.stringify(safe) });
      return safe;
    },
    async erase() {
      await workspaceStorage.clear();
      await Promise.allSettled([
        modeStorage.remove({ key: LEGACY_LOCAL_WORKSPACE_KEY }),
        modeStorage.remove({ key: LOCAL_MODE_KEY }),
      ]);
    },
  };
}

export const localRepository = createLocalRepository();

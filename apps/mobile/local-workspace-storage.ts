import { registerPlugin } from '@capacitor/core';

const WEB_LOCAL_WORKSPACE_KEY = 'pico.mobile.local.v1.workspace';

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocalWorkspaceStorage {
  read(): Promise<{ value: string | null }>;
  write(options: { value: string }): Promise<void>;
  clear(): Promise<void>;
}

function browserLocalStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error('localStorage indisponível');
    return storage;
  } catch {
    throw new Error('O armazenamento local deste navegador não está disponível.');
  }
}

export function createWebLocalWorkspaceStorage(storage?: BrowserStorage): LocalWorkspaceStorage {
  const resolveStorage = () => storage ?? browserLocalStorage();

  return {
    async read() {
      try {
        return { value: resolveStorage().getItem(WEB_LOCAL_WORKSPACE_KEY) };
      } catch {
        throw new Error('Não foi possível ler os dados locais neste navegador.');
      }
    },
    async write({ value }) {
      try {
        resolveStorage().setItem(WEB_LOCAL_WORKSPACE_KEY, value);
      } catch {
        throw new Error('Não foi possível salvar os dados locais neste navegador.');
      }
    },
    async clear() {
      try {
        resolveStorage().removeItem(WEB_LOCAL_WORKSPACE_KEY);
      } catch {
        throw new Error('Não foi possível apagar os dados locais neste navegador.');
      }
    },
  };
}

export const localWorkspaceStorage = registerPlugin<LocalWorkspaceStorage>('PicoLocalWorkspace', {
  web: () => Promise.resolve(createWebLocalWorkspaceStorage()),
});

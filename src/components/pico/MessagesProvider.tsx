'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ConversationPage } from '@/types/messages';

type Result = { cursor: string | null; revision: number; data: ConversationPage | null; error: string };
type MessagesContextValue = {
  enabled: boolean;
  demo: boolean;
  online: boolean;
  identityVersion: number;
  data: ConversationPage | null;
  error: string;
  loading: boolean;
  refreshing: boolean;
  cursor: string | null;
  setCursor: (cursor: string | null) => void;
  refresh: () => void;
};

const emptyPage: ConversationPage = { items: [], nextCursor: null, unreadCount: 0 };
// Standalone profile previews fail closed when the social provider is absent.
const MessagesContext = createContext<MessagesContextValue>({
  enabled: false, demo: false, online: true, identityVersion: 0,
  data: null, error: '', loading: false, refreshing: false, cursor: null,
  setCursor: () => {}, refresh: () => {},
});

function subscribeNetwork(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => { window.removeEventListener('online', callback); window.removeEventListener('offline', callback); };
}

export function messagesCanRefresh() {
  return document.visibilityState === 'visible' && navigator.onLine;
}

export function MessagesProvider({ enabled, demo, children }: { enabled: boolean; demo: boolean; children: ReactNode }) {
  const online = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);
  const [identityVersion, setIdentityVersion] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const identityGeneration = useRef(0);
  // New activity moves a conversation above an older cursor. Refreshing always
  // reopens the first page rather than promising a frozen inbox snapshot.
  const refresh = useCallback(() => { setCursor(null); setRevision(value => value + 1); }, []);

  useEffect(() => {
    if (!enabled || demo || !online || !messagesCanRefresh()) return;
    const controller = new AbortController();
    const generation = identityGeneration.current;
    async function load() {
      try {
        const response = await fetch('/api/messages' + (cursor ? '?before=' + encodeURIComponent(cursor) : ''), {
          cache: 'no-store', credentials: 'same-origin',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const payload = await response.json();
        if (!response.ok) throw Error(payload.message || 'Não foi possível carregar suas conversas.');
        if (!Array.isArray(payload.data?.items) || !Number.isSafeInteger(payload.data?.unreadCount)) throw Error('Não foi possível carregar suas conversas.');
        if (!controller.signal.aborted && generation === identityGeneration.current) setResult({ cursor, revision, data: payload.data, error: '' });
      } catch (error) {
        if (!controller.signal.aborted && generation === identityGeneration.current) setResult({
          cursor, revision, data: null,
          error: error instanceof Error && error.name === 'Error' ? error.message : 'Confira sua conexão e tente novamente.',
        });
      }
    }
    void load();
    return () => controller.abort();
  }, [enabled, demo, online, cursor, revision, identityVersion]);

  useEffect(() => {
    if (!enabled || demo) return;
    let identity: string | null | undefined;
    const subscription = createClient()?.auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (identity === undefined && event === 'INITIAL_SESSION') { identity = next; return; }
      if (event === 'SIGNED_OUT' || next !== identity) {
        identity = next;
        identityGeneration.current += 1;
        setResult(null); setCursor(null); setIdentityVersion(value => value + 1);
        refresh();
      }
    }).data.subscription;
    const foreground = () => { if (messagesCanRefresh()) refresh(); };
    const timer = window.setInterval(foreground, 30000);
    window.addEventListener('focus', foreground);
    window.addEventListener('online', foreground);
    document.addEventListener('visibilitychange', foreground);
    return () => {
      clearInterval(timer); subscription?.unsubscribe();
      window.removeEventListener('focus', foreground);
      window.removeEventListener('online', foreground);
      document.removeEventListener('visibilitychange', foreground);
    };
  }, [enabled, demo, refresh]);

  const current = result?.cursor === cursor ? result : null;
  const live = enabled && !demo;
  return <MessagesContext.Provider key={identityVersion} value={{
    enabled, demo, online, identityVersion, cursor, setCursor, refresh,
    data: demo ? emptyPage : current?.data ?? null,
    error: current?.error ?? '',
    loading: live && !current,
    refreshing: live && online && (!current || current.revision !== revision),
  }}>{children}</MessagesContext.Provider>;
}

export function useMessages() { return useContext(MessagesContext); }

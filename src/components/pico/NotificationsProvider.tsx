'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NotificationPage } from '@/types/notifications';

const emptyPage: NotificationPage = { items: [], unreadCount: 0, nextCursor: null };
type Result = { cursor: string | null; revision: number; data: NotificationPage | null; error: string };
type Context = {
  data: NotificationPage | null;
  error: string;
  loading: boolean;
  refreshing: boolean;
  busy: boolean;
  demo: boolean;
  notice: { error: boolean; text: string } | null;
  cursor: string | null;
  setCursor: (cursor: string | null) => void;
  refresh: () => void;
  markRead: (ids?: string[]) => Promise<void>;
};
const NotificationsContext = createContext<Context | null>(null);

export function NotificationsProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Context['notice']>(null);
  const lock = useRef(false);
  const identityGeneration = useRef(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    const generation = identityGeneration.current;
    async function load() {
      try {
        const response = await fetch('/api/notifications' + (cursor ? '?before=' + encodeURIComponent(cursor) : ''), {
          cache: 'no-store', credentials: 'same-origin',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const payload = await response.json();
        if (!response.ok) throw Error(payload.message || 'Não foi possível carregar as notificações.');
        if (!Array.isArray(payload.data?.items) || !Number.isSafeInteger(payload.data?.unreadCount)) throw Error('Não foi possível carregar as notificações.');
        if (!controller.signal.aborted && generation === identityGeneration.current) setResult({ cursor, revision, data: payload.data, error: '' });
      } catch (error) {
        if (!controller.signal.aborted && generation === identityGeneration.current) setResult({ cursor, revision, data: null, error: error instanceof Error && error.name === 'Error' ? error.message : 'Confira sua conexão e tente novamente.' });
      }
    }
    void load();
    return () => controller.abort();
  }, [demo, cursor, revision]);

  useEffect(() => {
    if (demo) return;
    let identity: string | null = null;
    const subscription = createClient()?.auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (event === 'INITIAL_SESSION') { identity = next; return; }
      if (event === 'SIGNED_OUT' || next !== identity || event === 'USER_UPDATED') {
        identity = next; identityGeneration.current += 1;
        setResult(null); setNotice(null); setCursor(null); refresh();
      }
    }).data.subscription;
    const foreground = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = window.setInterval(foreground, 30000);
    window.addEventListener('focus', foreground);
    document.addEventListener('visibilitychange', foreground);
    return () => { clearInterval(timer); subscription?.unsubscribe(); window.removeEventListener('focus', foreground); document.removeEventListener('visibilitychange', foreground); };
  }, [demo, refresh]);

  async function markRead(ids?: string[]) {
    if (demo || lock.current) return;
    lock.current = true; setBusy(true); setNotice(null);
    const generation = identityGeneration.current;
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { action: 'read', ids } : { action: 'read-all' }), signal: AbortSignal.timeout(15000),
      });
      const payload = await response.json();
      if (!response.ok || payload.data?.saved !== true) throw Error(payload.message || 'Não foi possível marcar como lida.');
      if (generation === identityGeneration.current) {
        setNotice({ error: false, text: ids ? 'Notificação marcada como lida.' : 'Notificações marcadas como lidas.' });
        refresh();
      }
    } catch {
      if (generation === identityGeneration.current) setNotice({ error: true, text: 'Não foi possível confirmar a leitura. Tente novamente.' });
    } finally { lock.current = false; setBusy(false); }
  }

  const current = result?.cursor === cursor ? result : null;
  return <NotificationsContext.Provider value={{
    demo, cursor, setCursor, refresh, markRead, busy, notice,
    data: demo ? emptyPage : current?.data ?? null,
    error: demo ? '' : current?.error ?? '',
    loading: !demo && !current,
    refreshing: !demo && current?.revision !== revision,
  }}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw Error('NotificationsProvider is required.');
  return context;
}

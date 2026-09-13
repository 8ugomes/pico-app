'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReadResponse } from '@/types/read';

type ReadState = ReadResponse | { status: 'loading' };
export function useRemoteRead(query: string, enabled = true) {
  const identity = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retain, setRetain] = useState(false);
  const [result, setResult] = useState<{ query: string; attempt: number; state: ReadState; warning?: boolean } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/social/read?${query}`, {
          cache: 'no-store', credentials: 'same-origin',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const payload: ReadResponse = await response.json();
        if (!['success', 'error', 'demo'].includes(payload.status)) throw new Error('Invalid response');
        if (!response.ok && payload.status !== 'error') throw new Error('Invalid response status');
        if (active) setResult(previous => retain && payload.status === 'error' && payload.code === 'unavailable' && previous?.query === query && previous.state.status === 'success' ? {query,attempt,state:previous.state,warning:true} : { query, attempt, state: payload });
      } catch {
        if (active) setResult(previous => retain && previous?.query === query && previous.state.status === 'success' ? {query,attempt,state:previous.state,warning:true} : { query, attempt, state: { status: 'error', code: 'unavailable', message: 'Não foi possível carregar agora. Confira sua conexão e tente novamente.' } });
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [query, attempt, retain, enabled]);
  useEffect(() => {
    if (!enabled) return;
    // Refresh on focus; account changes invalidate before loading any new private data.
    const refresh = () => { if (document.visibilityState === 'visible') { setRetain(true); setAttempt(value => value + 1); } };
    const client = createClient();
    const subscription = client?.auth.onAuthStateChange((event, session) => {
      const nextId = session?.user.id ?? null;
      if (event === 'INITIAL_SESSION') { identity.current = nextId; return; }
      if (event === 'SIGNED_OUT' || nextId !== identity.current || event === 'USER_UPDATED') { identity.current = nextId; setRetain(false); setAttempt(value => value + 1); }
    }).data.subscription;
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('focus', refresh); subscription?.unsubscribe(); };
  }, [enabled]);
  const state: ReadState = result?.query === query && (result.attempt === attempt || (retain && result.state.status === 'success')) ? result.state : { status: 'loading' };
  const retry = useCallback(() => { setRetain(false); setAttempt(value => value + 1); }, []);
  const refresh = useCallback(() => { setRetain(true); setAttempt(value => value + 1); }, []);
  useEffect(() => {
    if (!enabled || query !== 'resource=profile') return;
    window.addEventListener('pico:profile-saved', refresh);
    let channel: BroadcastChannel | undefined;
    try { channel = new BroadcastChannel('pico:profile'); channel.onmessage = () => refresh(); } catch { /* Focus still refreshes. */ }
    return () => { window.removeEventListener('pico:profile-saved', refresh); channel?.close(); };
  }, [enabled, query, refresh]);
  return { state, retry, refresh, refreshError: Boolean(result?.warning), refreshing: result?.attempt !== attempt };
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReadResponse } from '@/types/read';

type ReadState = ReadResponse | { status: 'loading' };
export function useRemoteRead(query: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ query: string; attempt: number; state: ReadState } | null>(null);
  useEffect(() => {
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
        if (active) setResult({ query, attempt, state: payload });
      } catch {
        if (active) setResult({ query, attempt, state: { status: 'error', code: 'unavailable', message: 'Não foi possível carregar agora. Confira sua conexão e tente novamente.' } });
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [query, attempt]);
  useEffect(() => {
    // Private data is discarded before refreshing when returning from another tab.
    const refresh = () => { if (document.visibilityState === 'visible') setAttempt(value => value + 1); };
    const client = createClient();
    const subscription = client?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') setAttempt(value => value + 1);
    }).data.subscription;
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('focus', refresh); subscription?.unsubscribe(); };
  }, []);
  const state: ReadState = result?.query === query && result.attempt === attempt ? result.state : { status: 'loading' };
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { state, retry };
}

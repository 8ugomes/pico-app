'use client';
import { useEffect, useState } from 'react';
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
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  const state: ReadState = result?.query === query && result.attempt === attempt ? result.state : { status: 'loading' };
  return { state, retry: () => setAttempt(value => value + 1) };
}

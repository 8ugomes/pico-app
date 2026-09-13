'use client';
import { useEffect, useState } from 'react';

export function useEntity<T>(url: string) {
  const [result, setResult] = useState<{ url: string; data: T | null; error: string } | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    fetch(url, { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Não foi possível carregar.');
        if (live) setResult({ url, data: payload.data, error: '' });
      })
      .catch(error => {
        if (!live) return;
        const message = error instanceof Error && !['TypeError', 'TimeoutError', 'AbortError'].includes(error.name)
          ? error.message : 'Não foi possível carregar agora. Confira sua conexão e tente novamente.';
        setResult({ url, data: null, error: message });
      });
    return () => { live = false; controller.abort(); };
  }, [url, revision]);
  return {
    data: result?.url === url ? result.data : null,
    error: result?.url === url ? result.error : '',
    loading: result?.url !== url,
    reload: () => setRevision(value => value + 1),
  };
}

export async function entityAction(url: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || 'Não foi possível confirmar.');
  return payload.data;
}

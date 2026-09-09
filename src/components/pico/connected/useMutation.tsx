'use client';
import { useRef, useState } from 'react';
import type { Mutation } from '@/lib/supabase/mutations';
export function useMutation() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  async function run(input: Mutation, success: string) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      const response = await fetch('/api/social/mutate', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(15000) });
      const payload = await response.json();
      if (!response.ok || payload.status !== 'success') { setMessage({ error: true, text: payload.message || 'Não foi possível salvar agora.' }); return false; }
      setMessage({ error: false, text: success }); return true;
    } catch {
      setMessage({ error: true, text: 'Não foi possível confirmar a alteração. Atualize para conferir antes de tentar de novo.' }); return false;
    } finally { lock.current = false; setBusy(false); }
  }
  return { run, busy, message };
}
export function MutationNotice({ message }: { message: ReturnType<typeof useMutation>['message'] }) {
  return message ? <p className={`auth-notice notice-${message.error ? 'error' : 'success'}`} role={message.error ? 'alert' : 'status'}>{message.text}</p> : null;
}

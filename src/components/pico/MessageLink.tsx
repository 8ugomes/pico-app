'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMessages } from './MessagesProvider';

export function MessageLink({ desktop = false }: { desktop?: boolean }) {
  const { enabled, demo, data } = useMessages();
  const path = usePathname();
  if (!enabled || demo) return null;
  const count = data?.unreadCount ?? 0;
  const current = path === '/mensagens' || path.startsWith('/mensagens/');
  return <Link href="/mensagens" className={desktop ? `nav-item ${current ? 'nav-current' : ''}` : 'icon-button'}
    aria-label={count ? `Mensagens, ${count} não ${count === 1 ? 'lida' : 'lidas'}` : 'Mensagens'} aria-current={current ? 'page' : undefined}>
    <span className="notification-icon"><MessageCircle size={22} aria-hidden="true" />{count > 0 && <span className="notification-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}</span>
    {desktop && <span>Mensagens</span>}
  </Link>;
}

export function OpenMessageButton({ playerId }: { playerId: string }) {
  const { enabled, demo, online, refresh } = useMessages();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  if (!enabled || demo) return null;

  async function open() {
    if (request.current || !navigator.onLine) return;
    const controller = new AbortController();
    request.current = controller; setBusy(true); setError('');
    try {
      const response = await fetch('/api/messages', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', playerId }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.data?.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.data.id)) throw Error(payload.message || 'Não foi possível abrir a conversa.');
      if (!controller.signal.aborted) { refresh(); router.push('/mensagens/' + encodeURIComponent(payload.data.id)); }
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error && failure.name === 'Error' ? failure.message : 'Confira sua conexão e tente novamente.');
    } finally {
      if (!controller.signal.aborted) { request.current = null; setBusy(false); }
    }
  }

  return <div className="message-profile-action">
    <Button size="small" variant="secondary" disabled={busy || !online} onClick={() => void open()}><MessageCircle size={18} aria-hidden="true" />{busy ? 'Abrindo…' : 'Mensagem'}</Button>
    {!online && <p className="form-note" role="status">Conecte-se para abrir a conversa.</p>}
    {error && <p className="form-note" role="alert">{error}</p>}
  </div>;
}

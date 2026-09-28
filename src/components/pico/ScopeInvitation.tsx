'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { authDestination, clearInvitation, invitationToken, rememberInvitation } from '@/lib/auth/navigation';
import { Button } from '@/components/ui/Button';
import { entityAction } from './connected/useEntity';

export function ScopeInvitation({ kind }: { kind: 'arena' | 'community' }) {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    const value = invitationToken();
    if (value) queueMicrotask(() => setToken(value));
  }, []);

  useEffect(() => {
    if (!/^[a-f0-9]{64}$/.test(token)) return;
    const controller = new AbortController();
    void entityAction('/api/invitations/preview', { kind, token }, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])).catch(() => undefined);
    return () => controller.abort();
  }, [kind, token]);

  return <main id="main-content" className="auth-panel glass-panel standalone-panel">
    <h1>{kind === 'arena' ? 'Convite de gestão' : 'Convite de comunidade'}</h1>
    <p>Entre com a conta Pico ativa do @usuário indicado. Abrir o link não aceita o convite.</p>
    <form className="connected-form" onSubmit={async event => {
      event.preventDefault();
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      setFailed(false);
      setMessage('');
      try {
        await entityAction(kind === 'arena' ? '/api/arenas' : '/api/communities', { action: 'accept', token }, AbortSignal.timeout(15000));
        clearInvitation();
        setToken('');
        setMessage('Convite aceito. Acesse seus Picos para continuar.');
      } catch (error) {
        setFailed(true);
        setMessage(error instanceof DOMException && error.name === 'TimeoutError'
          ? 'Não recebemos a confirmação. Tente novamente; repetir o aceite com esta conta é seguro.'
          : error instanceof Error ? error.message : 'Convite indisponível.');
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }}>
      <label className="input-group">Código individual<input className="input" autoComplete="off" value={token} maxLength={64} onChange={event => { setToken(event.target.value); rememberInvitation(location.pathname, event.target.value); }} /></label>
      <Button type="submit" disabled={busy || token.length !== 64}>{busy ? 'Confirmando…' : 'Aceitar com esta conta'}</Button>
    </form>
    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
    <p><Link href={authDestination('login', `/convite/${kind}`)}>Entrar</Link> · <Link href="/admin">Meus Picos</Link></p>
  </main>;
}

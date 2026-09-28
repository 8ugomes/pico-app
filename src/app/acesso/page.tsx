'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AccountExport } from '@/components/pico/AccountExport';
import { SignOutButton } from '@/components/pico/SignOutButton';
import { Button } from '@/components/ui/Button';
import { authDestination, clearInvitation, invitationToken, rememberInvitation } from '@/lib/auth/navigation';
import { clearPushBeforeSignOut } from '@/lib/push/client';

export default function AccessPage() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    const hash = invitationToken();
    if (hash) queueMicrotask(() => setToken(hash));
  }, []);

  return <main id="main-content" className="auth-panel glass-panel standalone-panel">
    <h1>Acesso ao Pico</h1>
    <p>Crie sua conta com e-mail e senha para entrar. Nesta beta, não há confirmação nem recuperação por e-mail. Não é preciso convite nem aprovação manual. Convites de comunidades e gestão continuam com suas próprias regras.</p>
    <p><Link href="/perfil">Continuar no Pico</Link></p>
    <details>
      <summary>Recebi um convite antigo</summary>
      <form className="connected-form" onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        try {
          const response = await fetch('/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
          const data = await response.json();
          if (!response.ok) throw Error(data.message || 'Convite indisponível.');
          clearInvitation();
          location.assign(new URL('/perfil', location.origin).href);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar.');
        } finally { setBusy(false); }
      }}>
        <label className="input-group">Código do convite<input className="input" value={token} onChange={event => { setToken(event.target.value); rememberInvitation(location.pathname, event.target.value); }} autoComplete="off" maxLength={64} /></label>
        <Button type="submit" disabled={busy || token.length !== 64}>Confirmar acesso com esta conta</Button>
      </form>
    </details>
    <p role="status">{message}</p>
    <p><Link href={authDestination('login', '/acesso')}>Entrar</Link> · <Link href={authDestination('signup', '/acesso')}>Criar conta</Link> · <Link href="/recuperar">Recuperar senha</Link> · <Link href="/privacidade">Privacidade</Link></p>
    <SignOutButton invitationNext="/acesso" />
    <AccountExport />
    <details>
      <summary>Excluir minha conta</summary>
      <p>Disponível mesmo sem admissão. Seus dados pessoais e fotos serão removidos.</p>
      <form className="connected-form" onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        try {
          const response = await fetch('/api/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, confirmation }) });
          const data = await response.json();
          if (!response.ok) throw Error(data.message);
          await clearPushBeforeSignOut();
          location.assign(new URL('/login', location.origin).href);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Não foi possível excluir.');
        } finally { setBusy(false); }
      }}>
        <label className="input-group">Senha atual<input className="input" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label className="input-group">Digite EXCLUIR<input className="input" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        <Button type="submit" disabled={busy || confirmation !== 'EXCLUIR'}>Excluir minha conta</Button>
      </form>
    </details>
  </main>;
}

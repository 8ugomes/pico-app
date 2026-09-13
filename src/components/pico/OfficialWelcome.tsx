'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { entityAction } from './connected/useEntity';

type Welcome = { id: string; slug: string; name: string; pending: boolean };

export function OfficialWelcome() {
  const requestVersion = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const path = usePathname(), router = useRouter();
  const [welcome, setWelcome] = useState<Welcome | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  useEffect(() => {
    const saved = () => setRevision(value => value + 1);
    window.addEventListener('pico:profile-saved', saved);
    return () => window.removeEventListener('pico:profile-saved', saved);
  }, []);
  useEffect(() => {
    let live = true;
    const version = ++requestVersion.current;
    entityAction('/api/welcome', { action: 'check' }).then(data => {
      if (live && version === requestVersion.current) { setWelcome(data?.pending ? data : null); setError(''); }
    }).catch(() => { if (live && version === requestVersion.current) setError('Não foi possível conferir suas boas-vindas.'); });
    return () => { live = false; };
  }, [path, revision]);
  useEffect(() => {
    if (welcome?.pending && revision > 0) { heading.current?.scrollIntoView({ block: 'start' }); heading.current?.focus({ preventScroll: true }); }
  }, [welcome?.pending, revision]);
  async function acknowledge(visit: boolean) {
    if (!welcome || busy) return;
    ++requestVersion.current; // A delayed check cannot restore an acknowledged notice.
    setBusy(true); setError('');
    try {
      await entityAction('/api/welcome', { action: 'acknowledge' });
      setWelcome(null);
      if (visit) router.push('/comunidades/' + welcome.slug);
    } catch { setError('Não foi possível confirmar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  if (!welcome && !error) return null;
  return <section className="official-welcome" aria-label="Boas-vindas ao Pico" aria-live="polite">
    {welcome && <><h2 ref={heading} tabIndex={-1}>Você entrou na comunidade oficial do Pico.</h2><p>Seu perfil está pronto e você já faz parte deste encontro entre modalidades. Conheça a comunidade; você pode sair quando quiser.</p><div className="read-message-actions"><Button disabled={busy} onClick={() => acknowledge(true)}>Conhecer a comunidade</Button><Button variant="quiet" disabled={busy} onClick={() => acknowledge(false)}>Entendi</Button></div></>}
    {error && <p role="status">{error} <Button size="small" variant="quiet" disabled={busy} onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button></p>}
  </section>;
}

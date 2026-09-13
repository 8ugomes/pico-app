'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function RepostAttribution({ name, href, createdAt }: { name: string; href: string; createdAt: string }) {
  return <p className="post-repost-attribution"><Repeat2 size={16} aria-hidden="true" /><span><Link href={href}>{name}</Link> republicou <time dateTime={createdAt} title={new Date(createdAt).toLocaleString('pt-BR')}>em {new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</time></span></p>;
}

export function RepostControl({ reposted, author, audience, demo = false, onChange }: {
  reposted: boolean; author: string; audience: 'beta' | 'private'; demo?: boolean;
  onChange: (reposted: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    const next = !reposted;
    try {
      await onChange(next);
      setNotice(demo ? (next ? 'Republicação simulada neste navegador.' : 'Republicação desfeita na demonstração.') : (next ? 'Publicação republicada.' : 'Republicação desfeita.'));
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível confirmar. Atualize a publicação para conferir.');
    } finally { lock.current = false; setBusy(false); }
  }
  return <>
    <button type="button" className={`post-action repost-action ${reposted ? 'is-reposted' : ''}`} aria-pressed={reposted} aria-label={`${reposted ? 'Desfazer republicação' : 'Republicar'} de ${author}`} onClick={() => { setError(''); setOpen(true); }}>
      <Repeat2 size={21} aria-hidden="true" /><span>{reposted ? 'Republicado' : 'Republicar'}</span>
    </button>
    <span className="sr-only" role="status">{notice}</span>
    <Modal open={open} onClose={() => { if (!busy) setOpen(false); }} title={reposted ? 'Desfazer republicação?' : 'Republicar?'}>
      <p>{reposted ? 'Ela sai das suas republicações. A publicação original continua com suas curtidas e comentários.' : `A publicação de ${author} aparece no seu perfil e no Início de quem acompanha você.`}</p>
      {!reposted && <p className="form-note">{audience === 'private' ? 'Só participantes do grupo privado que já têm acesso poderão vê-la.' : 'A audiência original é mantida: pessoas com acesso ao Pico.'}</p>}
      {demo && <p className="form-note">Demonstração: fica apenas neste navegador, sem envio para outras pessoas.</p>}
      {error && <p className="auth-notice notice-error" role="alert">{error}</p>}
      <div className="form-actions repost-confirmation-actions"><Button disabled={busy} onClick={submit}>{busy ? 'Confirmando…' : reposted ? 'Desfazer republicação' : 'Republicar'}</Button><Button variant="quiet" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button></div>
    </Modal>
  </>;
}

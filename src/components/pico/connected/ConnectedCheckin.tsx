'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { ReadArena } from '@/types/read';
import { Button } from '@/components/ui/Button';
import { PageHeading, EmptyState } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading, ConnectedSource } from './ReadState';
import { useMutation, MutationNotice } from './useMutation';
import { ArenaSportPicker } from './ArenaSportPicker';
export function ConnectedCheckin({ initialSlug }: { initialSlug?: string }) {
  const { state, retry, refresh } = useRemoteRead('resource=checkin');
  const mutation = useMutation();
  const [selection, setSelection] = useState<{ arena: ReadArena; sportId: string } | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000); return () => clearInterval(timer); }, [refresh]);
  const data = state.status === 'success' && state.data.kind === 'checkin' ? state.data : null;
  const own = data?.own && Date.parse(data.own.expiresAt) > now ? data.own : null;
  const presence = data?.presence.filter(p => Date.parse(p.expiresAt) > now) ?? [];
  return <>
    <PageHeading eyebrow="ME ACHA NA AREIA" title="Chegou no Pico?" />
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <>
      <ConnectedSource />
      {own && <section className="connected-panel"><p className="availability available"><span />Você está no Pico</p><h2>{own.arena.name}</h2><p>{own.sport.name} · Até {new Date(own.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p><Button variant="secondary" disabled={mutation.busy} onClick={async () => { if (await mutation.run({ action: 'end_checkin' }, 'Check-in encerrado.')) retry(); }}>Encerrar check-in</Button></section>}
      <section className="connected-panel"><h2>{own ? 'Mudou de arena?' : 'Conta onde você está.'}</h2><p className="muted-text">Seu check-in aparece para outros jogadores por até 2 horas. Você pode encerrar quando quiser.</p><form className="connected-form" onSubmit={async e => { e.preventDefault(); if (selection && await mutation.run({ action: 'start_checkin', arenaId: selection.arena.id, sportId: selection.sportId }, 'Check-in feito. Me acha no Pico!')) retry(); }}><fieldset disabled={mutation.busy}><ArenaSportPicker initialSlug={initialSlug} value={selection} onChange={setSelection} /><Button type="submit" disabled={!selection?.sportId}>{mutation.busy ? 'Salvando…' : own ? 'Trocar meu check-in' : 'Fazer check-in'}</Button></fieldset></form></section>
      <div className="list-heading"><h2>Na areia agora</h2><Button size="small" variant="quiet" onClick={retry}>Atualizar</Button></div>
      <p className="muted-text">Até 24 presenças recentes · atualização a cada 30 segundos.</p>
      {presence.map(p => <article className="connected-panel" key={p.id}><Link href={`/perfil/${p.username}`}><strong>{p.name}</strong></Link><p><MapPin size={14} aria-hidden="true" /> <Link href={`/arenas/${p.arena.slug}`}>{p.arena.name}</Link> · {p.sport.name}</p></article>)}
      {!presence.length && <EmptyState title="A roda pode começar com você.">Nenhum outro check-in ativo por aqui.</EmptyState>}
    </>}
    <MutationNotice message={mutation.message} />
  </>;
}

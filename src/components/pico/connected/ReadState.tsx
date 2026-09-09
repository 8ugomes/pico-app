'use client';
import Link from 'next/link';
import { ArrowUpRight, LoaderCircle, RefreshCw, UserRound, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import type { ReadResponse } from '@/types/read';

export function ReadLoading() {
  return <section className="read-loading" aria-busy="true" aria-label="Carregando conteúdo">
    <p className="read-source" role="status"><LoaderCircle size={16} className="spinner" aria-hidden="true" /> Consultando…</p>
    <div className="read-skeleton read-skeleton-photo" aria-hidden="true" />
    <div className="read-skeleton read-skeleton-title" aria-hidden="true" />
    <div className="read-skeleton" aria-hidden="true" />
  </section>;
}
export function ConnectedSource() {
  return <p className="read-source" role="status"><span className="live-dot" /> Dados conectados</p>;
}
export function ReadFailure({ state, retry }: { state: Exclude<ReadResponse, { status: 'success' }>; retry: () => void }) {
  if (state.status === 'demo') return <section className="read-message"><h2>Demonstração disponível</h2><p>O serviço de dados não está configurado neste momento.</p><Button onClick={() => window.location.reload()}>Abrir demonstração</Button></section>;
  const login = state.code === 'authentication';
  const missing = state.code === 'not_found';
  return <section className="read-message" role={login || missing ? 'status' : 'alert'}>
    {login ? <UserRound size={28} aria-hidden="true" /> : <TriangleAlert size={26} aria-hidden="true" />}
    <h2>{login ? 'Seu perfil te espera.' : missing ? 'Esse Pico não está por aqui.' : state.code === 'profile_missing' ? 'Seu perfil ainda não apareceu.' : 'Não deu para carregar.'}</h2>
    <p>{state.message}</p>
    <div className="read-message-actions">
      {login ? <Link className={buttonVariants()} href="/login">Entrar na minha conta <ArrowUpRight size={17} aria-hidden="true" /></Link> : missing ? <Link className={buttonVariants()} href="/arenas">Explorar arenas</Link> : <Button onClick={retry}><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</Button>}
    </div>
  </section>;
}

'use client';
import { ArenaCommunities } from './ArenaCommunities';
import { ArenaExtras, ArenaRequest } from './ArenaManagement';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, MapPin, Volleyball } from 'lucide-react';
import type { ReadArena, ReadSport } from '@/types/read';
import { PageHeading, SearchField, SportIcon, EmptyState } from '../SocialUI';
import { normalizeSearch } from '@/lib/demo-state';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ConnectedFeed } from './ConnectedFeed';
import { useRemoteRead } from './useRemoteRead';
import { ConnectedSource, ReadFailure, ReadLoading } from './ReadState';

export function ReadSports({ sports }: { sports: ReadSport[] }) {
  return <div className="arena-sports">{sports.map(s => <span className="sport-label" key={s.id}><SportIcon sport={s.slug} />{s.name}</span>)}</div>;
}
export function ArenaImage({ arena, detail = false }: { arena: ReadArena; detail?: boolean }) {
  return <div className={detail ? 'arena-detail-photo' : 'arena-card-photo'}>
    {arena.image ? <Image src={arena.image} alt={`Imagem ilustrativa de ${arena.name}.`} width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" /> : <div className="read-arena-placeholder"><Volleyball size={40} strokeWidth={1} aria-hidden="true" /><span>Um lugar para jogar.</span></div>}
    {arena.isDemo && <span className="arena-live-badge">Arena de demonstração</span>}
  </div>;
}
export function ConnectedArenas() {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('all');
  const { state, retry } = useRemoteRead(`resource=arenas&offset=${offset}`);
  const data = state.status === 'success' && state.data.kind === 'arenas' ? state.data : null;
  const arenas = data?.arenas.filter(a => normalizeSearch(`${a.name} ${a.neighborhood} ${a.city}`).includes(normalizeSearch(query)) && (sport === 'all' || a.sports.some(s => s.id === sport))) ?? [];
  return <>
    <PageHeading eyebrow="SEU PRÓXIMO PICO" title="Encontre seu lugar." />
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <>
      <ConnectedSource /><details className="arena-about"><summary>Solicitar cadastro de uma arena</summary><ArenaRequest /></details>
      <SearchField value={query} onChange={setQuery} placeholder="Arena, bairro ou cidade" label="Buscar arenas nesta página" />
      <div className="sport-filters" aria-label="Filtrar arenas por esporte nesta página">
        <button className={`filter-chip ${sport === 'all' ? 'selected' : ''}`} aria-pressed={sport === 'all'} onClick={() => setSport('all')}>Todos</button>
        {data.sports.map(s => <button key={s.id} className={`filter-chip ${sport === s.id ? 'selected' : ''}`} aria-pressed={sport === s.id} onClick={() => setSport(s.id)}><SportIcon sport={s.slug} />{s.name}</button>)}
      </div>
      <div className="list-heading"><span>{arenas.length} {arenas.length === 1 ? 'arena' : 'arenas'} nesta página</span><Button size="small" variant="quiet" onClick={retry}>Atualizar</Button></div>
      <div className="arena-list">{arenas.map(arena => <article key={arena.id} className="arena-card"><Link href={`/arenas/${arena.slug}`}><ArenaImage arena={arena} /><div className="arena-card-content"><h2>{arena.name}</h2><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood} · {arena.city}</p><ReadSports sports={arena.sports} /></div></Link></article>)}</div>
      {!data.arenas.length && <EmptyState title="Novos Picos vão aparecer por aqui.">Ainda não há arenas públicas cadastradas nesta página.</EmptyState>}
      {Boolean(data.arenas.length) && !arenas.length && <EmptyState title="Nenhuma arena corresponde à busca.">Tente outro nome ou esporte nesta página.</EmptyState>}
      {(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de arenas"><Button size="small" variant="secondary" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 24))}><ArrowLeft size={16} aria-hidden="true" /> Anterior</Button><span>Página {offset / 24 + 1}</span><Button size="small" variant="secondary" disabled={!data.hasMore} onClick={() => setOffset(offset + 24)}>Próxima <ArrowRight size={16} aria-hidden="true" /></Button></nav>}
    </>}
  </>;
}
export function ConnectedArena({ slug }: { slug: string }) {
  const { state, retry } = useRemoteRead(`resource=arena&slug=${encodeURIComponent(slug)}`);
  const arena = state.status === 'success' && state.data.kind === 'arena' ? state.data.arena : null;
  return <>
    <Link href="/arenas" className="detail-back"><ArrowLeft size={17} aria-hidden="true" /> Arenas</Link>
    {state.status === 'loading' && <><PageHeading eyebrow="CONHEÇA O LUGAR" title="Sua próxima arena." /><ReadLoading /></>}
    {(state.status === 'error' || state.status === 'demo') && <><PageHeading eyebrow="CONHEÇA O LUGAR" title="Sua próxima arena." /><ReadFailure state={state} retry={retry} /></>}
    {arena && <><ConnectedSource /><ArenaImage arena={arena} detail /><header className="arena-detail-header"><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood} · {arena.city}</p><h1>{arena.name}</h1><ReadSports sports={arena.sports} /></header><section className="arena-about"><h2>Um pouco deste Pico</h2><p>{arena.description || 'A descrição deste lugar ainda não foi adicionada.'}</p>{!arena.sports.length && <p className="form-note">As modalidades ainda não foram informadas.</p>}{arena.isDemo && <p className="form-note">Arena fictícia, cadastrada para explorar o Pico.</p>}</section><div className="read-message-actions"><Link className={buttonVariants()} href={`/checkin?arena=${arena.slug}`}>Fazer check-in</Link></div><Button variant="secondary" onClick={retry}>Atualizar arena</Button><ArenaExtras slug={arena.slug} /><ArenaCommunities arenaId={arena.id} /><ConnectedFeed arenaId={arena.id} initialSlug={arena.slug} /></>}
  </>;
}

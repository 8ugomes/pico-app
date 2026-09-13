'use client';
import { ArenaCommunities } from './ArenaCommunities';
import { ArenaExtras, ArenaRequest, type ArenaProfile } from './ArenaManagement';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import type { ReadSport } from '@/types/read';
import { PageHeading, SearchField, SportIcon, EmptyState } from '../SocialUI';
import { normalizeSearch } from '@/lib/demo-state';
import { Button } from '@/components/ui/Button';
import { ConnectedFeed } from './ConnectedFeed';
import { useEntity } from './useEntity';
import { mediaUrl } from '@/lib/supabase/media';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { ArenaGallery, ArenaImage } from './ArenaGallery';

export function ReadSports({ sports }: { sports: ReadSport[] }) {
  return <div className="arena-sports">{sports.map(s => <span className="sport-label" key={s.id}><SportIcon sport={s.slug} />{s.name}</span>)}</div>;
}
export function ConnectedArenas() {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('all');
  const [region, setRegion] = useState('all');
  const { state, retry } = useRemoteRead(`resource=arenas&offset=${offset}`);
  const data = state.status === 'success' && state.data.kind === 'arenas' ? state.data : null;
  const arenas = data?.arenas.filter(a => normalizeSearch(`${a.name} ${a.neighborhood} ${a.city} ${a.directory?.address ?? ''}`).includes(normalizeSearch(query)) && (sport === 'all' || a.sports.some(s => s.id === sport)) && (region === 'all' || a.directory?.region === region)) ?? [];
  return <>
    <PageHeading title="Arenas" />
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <>
      <SearchField tourId="arena-search" value={query} onChange={setQuery} placeholder="Nome, bairro ou endereço" label="Buscar arenas nesta página" />
      <div className="sport-filters" aria-label="Filtrar arenas por esporte nesta página">
        <button className={`filter-chip ${sport === 'all' ? 'selected' : ''}`} aria-pressed={sport === 'all'} onClick={() => setSport('all')}>Todos</button>
        {data.sports.map(s => <button key={s.id} className={`filter-chip ${sport === s.id ? 'selected' : ''}`} aria-pressed={sport === s.id} onClick={() => setSport(s.id)}><SportIcon sport={s.slug} />{s.name}</button>)}
      </div>
      <div className="sport-filters" aria-label="Filtrar por região">{['all', 'Sul', 'Oeste'].map(r => <button key={r} className={`filter-chip ${region === r ? 'selected' : ''}`} aria-pressed={region === r} onClick={() => setRegion(r)}>{r === 'all' ? 'São Paulo' : `Zona ${r}`}</button>)}</div>
      <div className="list-heading"><span>{arenas.length} {arenas.length === 1 ? 'arena' : 'arenas'} nesta página</span><Button size="small" variant="quiet" onClick={retry}>Atualizar</Button></div>
      <div className="arena-list arena-directory-list">{arenas.map(arena => <article key={arena.id} className="arena-card"><Link href={`/arenas/${arena.slug}`}><ArenaImage arena={arena} /><div className="arena-card-content"><h2>{arena.name}</h2><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood}{arena.directory ? ` · Zona ${arena.directory.region}` : ` · ${arena.city}`}</p><ReadSports sports={arena.sports} /></div></Link></article>)}</div>
      {!data.arenas.length && <EmptyState title="Novos Picos vão aparecer por aqui.">Ainda não há arenas públicas cadastradas nesta página.</EmptyState>}
      {Boolean(data.arenas.length) && !arenas.length && <EmptyState title="Nenhuma arena corresponde à busca.">Tente outro nome ou esporte nesta página.</EmptyState>}
      <details className="arena-about"><summary>Não encontrou a arena? Solicitar cadastro</summary><ArenaRequest /></details>
      {(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de arenas"><Button size="small" variant="secondary" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 24))}><ArrowLeft size={16} aria-hidden="true" /> Anterior</Button><span>Página {offset / 24 + 1}</span><Button size="small" variant="secondary" disabled={!data.hasMore} onClick={() => setOffset(offset + 24)}>Próxima <ArrowRight size={16} aria-hidden="true" /></Button></nav>}
    </>}
  </>;
}
export function ConnectedArena({ slug }: { slug: string }) {
  const { state, retry } = useRemoteRead(`resource=arena&slug=${encodeURIComponent(slug)}`);
  const arena = state.status === 'success' && state.data.kind === 'arena' ? state.data.arena : null;
  const profile = useEntity<ArenaProfile>('/api/arenas?slug=' + encodeURIComponent(slug));
  return <>
    <Link href="/arenas" className="detail-back"><ArrowLeft size={17} aria-hidden="true" /> Arenas</Link>
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {arena && <>
      <ArenaGallery key={arena.id} arena={arena} cover={profile.data?.cover_path ? mediaUrl('entity-media', profile.data.cover_path) : null} />
      <header className="arena-detail-header"><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood} · {arena.city}</p><h1>{arena.name}</h1><ReadSports sports={arena.sports} />{arena.directory && <div className="arena-address"><p>{arena.directory.address}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${arena.name}, ${arena.directory.address}, ${arena.city}`)}`} target="_blank" rel="noopener noreferrer">Como chegar <ArrowRight size={15} aria-hidden="true" /></a></div>}</header>
      {profile.data && <ArenaExtras data={profile.data} directory={arena.directory} reload={profile.reload} />}
      {profile.error && <div className="read-message"><p role="alert">{profile.error}</p><Button variant="secondary" onClick={profile.reload}>Tentar novamente</Button></div>}
      <ArenaCommunities arenaId={arena.id} />
      <ConnectedFeed arenaId={arena.id} initialSlug={arena.slug} />
    </>}
  </>;
}

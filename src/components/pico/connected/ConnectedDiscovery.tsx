'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RemoteAvatar } from './Media';
import{CommonPlayers,ProfilePlaces}from'./ActivityHistory';
import{ConnectedFeed}from'./ConnectedFeed';
import { SafetyActions } from './SafetyActions';
import { Button } from '@/components/ui/Button';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { MutationNotice, useMutation } from './useMutation';
export function ConnectionButton({ playerId, connected, refresh }: { playerId: string; connected: boolean; refresh: () => void }) {
  const mutation = useMutation();
  return <div><Button size="small" variant={connected ? 'secondary' : 'primary'} disabled={mutation.busy} aria-pressed={connected} onClick={async () => { if (await mutation.run({ action: 'set_connection', playerId, connected: !connected }, connected ? 'Você deixou de acompanhar este jogador.' : 'Você começou a acompanhar este jogador. Isso não envia um convite.')) refresh(); }}>{mutation.busy ? 'Salvando…' : connected ? 'Deixar de acompanhar' : 'Acompanhar'}</Button><MutationNotice compact message={mutation.message} /></div>;
}
export function ConnectedDiscovery() {
  const [sport, setSport] = useState('');
  const [arena, setArena] = useState('');
  const [level, setLevel] = useState('');
  const [offset, setOffset] = useState(0);
  const [arenaOffset, setArenaOffset] = useState(0);
  const catalog = useRemoteRead(`resource=arenas&offset=${arenaOffset}`);
  const query = new URLSearchParams({ resource: 'discover', offset: String(offset) });
  if (sport) query.set('sportId', sport);
  if (arena) query.set('arenaId', arena);
  if (level) query.set('level', level);
  const { state, retry, refresh, refreshing } = useRemoteRead(query.toString());
  const data = state.status === 'success' && state.data.kind === 'discover' ? state.data : null;
  const players = data?.players ?? [];
  const options = catalog.state.status === 'success' && catalog.state.data.kind === 'arenas' ? catalog.state.data : null;
  return <>
    <PageHeading eyebrow="UM ESPORTE EM COMUM" title="Pessoas" />
    <p className="page-intro">Encontre quem compartilha seu esporte e seus lugares.</p>
    {catalog.state.status === 'loading' && <ReadLoading />}
    {(catalog.state.status === 'error' || catalog.state.status === 'demo') && <ReadFailure state={catalog.state} retry={catalog.retry} />}
    {options && <details className="discovery-filters"><summary data-tour="people-filters">Filtrar pessoas{(sport || arena || level) ? ` · ${[sport,arena,level].filter(Boolean).length} filtro(s)` : ""}</summary><div className="connected-form"><fieldset>
      <label className="input-group">Esporte<select className="input" value={sport} onChange={e => { setSport(e.target.value); setOffset(0); }}><option value="">Todos os esportes</option>{options.sports.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
      <label className="input-group">Arena acompanhada<select data-tour="people-arena" className="input" value={arena} onChange={e => { setArena(e.target.value); setOffset(0); }}><option value="">Todas as arenas</option>{options.arenas.map(a => <option value={a.id} key={a.id}>{a.name}{a.isDemo ? ' · Demo' : ''}</option>)}</select></label>
      {(arenaOffset > 0 || options.hasMore) && <nav className="read-pagination" aria-label="Catálogo de arenas"><Button variant="quiet" size="small" disabled={!arenaOffset} onClick={() => { setArenaOffset(arenaOffset - 24); setArena(''); setOffset(0); }}>Arenas anteriores</Button><Button variant="quiet" size="small" disabled={!options.hasMore} onClick={() => { setArenaOffset(arenaOffset + 24); setArena(''); setOffset(0); }}>Mais arenas</Button></nav>}
      <label className="input-group">Nível<select className="input" value={level} onChange={e => { setLevel(e.target.value); setOffset(0); }}><option value="">Todos os níveis</option>{['Iniciante', 'Intermediário', 'Avançado'].map(l => <option key={l}>{l}</option>)}</select></label>
      {(sport || arena || level) && <Button variant="quiet" size="small" onClick={() => { setSport(''); setArena(''); setLevel(''); setOffset(0); }}>Limpar filtros</Button>}
    </fieldset></div></details>}
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <><div className="list-heading"><span>{players.length} {players.length === 1 ? 'jogador' : 'jogadores'} nesta página</span><Button size="small" variant="quiet" disabled={refreshing} onClick={refresh}>{refreshing ? 'Atualizando…' : 'Atualizar'}</Button></div>
      {players.map(p => <article className="person-row" key={p.id}><Link className="post-person" href={`/perfil/${p.username}`}><RemoteAvatar src={p.avatar} name={p.display_name} /><span><strong>{p.display_name}</strong><small>@{p.username}</small></span></Link>{p.is_demo && <p className="form-note">Jogador de demonstração</p>}<p className="location-line">{[p.neighborhood, p.city].filter(Boolean).join(' · ')}</p><p className="person-bio">{p.bio}</p><p className="sport-label"><SportIcon sport={p.sport_slug} />{p.sport_name} · {p.level}</p><ConnectionButton playerId={p.id} connected={p.connected} refresh={refresh} /></article>)}
      <CommonPlayers />
      {!players.length && <EmptyState title="Nenhuma pessoa nesta busca.">Nenhum perfil completo corresponde aos filtros. Experimente outro esporte ou arena.</EmptyState>}
      {(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de jogadores"><Button variant="secondary" size="small" disabled={!offset} onClick={() => setOffset(offset - 24)}>Anterior</Button><span>Página {offset / 24 + 1}</span><Button variant="secondary" size="small" disabled={!data.hasMore} onClick={() => setOffset(offset + 24)}>Próxima</Button></nav>}
    </>}
  </>;
}
export function ConnectedPlayer({ username }: { username: string }) {
  const { state, retry, refresh } = useRemoteRead(`resource=player&username=${encodeURIComponent(username)}`);
  const data = state.status === 'success' && state.data.kind === 'player' ? state.data : null;
  return <><Link className="detail-back" href="/descobrir">← Pessoas</Link>
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <><section className="public-player-identity"><div className="read-profile-identity"><RemoteAvatar src={data.profile.avatar} name={data.profile.name} /><div><h1>{data.profile.name}</h1><p>@{data.profile.username}</p></div></div>{data.profile.isDemo && <p className="form-note">Jogador de demonstração</p>}<p className="location-line">{[data.profile.neighborhood, data.profile.city].filter(Boolean).join(' · ')}</p><p className="profile-bio">{data.profile.bio || 'A bio ainda não foi adicionada.'}</p><div className="profile-sports">{data.profile.sports.map(s => <p key={s.sport.id}><SportIcon sport={s.sport.slug} />{s.sport.name} · {s.level}{s.isPrimary ? ' · Principal' : ''}</p>)}</div>{data.own ? <Link href="/perfil">Meu perfil</Link> : <><ConnectionButton playerId={data.profile.id} connected={data.connected} refresh={refresh} /><SafetyActions target="player" id={data.profile.id} playerId={data.profile.id} onChange={retry} /></>}</section><ProfilePlaces playerId={data.profile.id}/><ConnectedFeed authorId={data.profile.id} readOnly/></>}
  </>;
}

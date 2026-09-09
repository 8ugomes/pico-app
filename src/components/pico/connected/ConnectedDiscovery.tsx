'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { ConnectedSource, ReadFailure, ReadLoading } from './ReadState';
import { MutationNotice, useMutation } from './useMutation';
export function ConnectionButton({ playerId, connected, refresh }: { playerId: string; connected: boolean; refresh: () => void }) {
  const mutation = useMutation();
  return <div><Button size="small" variant={connected ? 'secondary' : 'primary'} disabled={mutation.busy} aria-pressed={connected} onClick={async () => { if (await mutation.run({ action: 'set_connection', playerId, connected: !connected }, connected ? 'Você deixou de acompanhar este jogador.' : 'Jogador adicionado à sua turma.')) refresh(); }}>{mutation.busy ? 'Salvando…' : connected ? 'Desconectar' : 'Conectar'}</Button><MutationNotice compact message={mutation.message} /></div>;
}
export function ConnectedDiscovery() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const [sport, setSport] = useState('');
  const [arena, setArena] = useState('');
  const [level, setLevel] = useState('');
  const [active, setActive] = useState(false);
  const [offset, setOffset] = useState(0);
  const [arenaOffset, setArenaOffset] = useState(0);
  const catalog = useRemoteRead(`resource=arenas&offset=${arenaOffset}`);
  const query = new URLSearchParams({ resource: 'discover', offset: String(offset), active: String(active) });
  if (sport) query.set('sportId', sport);
  if (arena) query.set('arenaId', arena);
  if (level) query.set('level', level);
  const { state, retry, refresh, refreshing } = useRemoteRead(query.toString());
  const data = state.status === 'success' && state.data.kind === 'discover' ? state.data : null;
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000); return () => clearInterval(timer); }, [refresh]);
  const players = data?.players.filter(p => !active || (p.expires_at && Date.parse(p.expires_at) > now)) ?? [];
  const options = catalog.state.status === 'success' && catalog.state.data.kind === 'arenas' ? catalog.state.data : null;
  return <>
    <PageHeading eyebrow="SUA PRÓXIMA DUPLA" title="Encontre sua turma." />
    <p className="page-intro">Descubra quem joga no seu ritmo. Conecte para acompanhar um jogador.</p>
    {catalog.state.status === 'loading' && <ReadLoading />}
    {(catalog.state.status === 'error' || catalog.state.status === 'demo') && <ReadFailure state={catalog.state} retry={catalog.retry} />}
    {options && <section className="connected-panel"><div className="connected-form"><fieldset>
      <label className="input-group">Esporte<select className="input" value={sport} onChange={e => { setSport(e.target.value); setOffset(0); }}><option value="">Todos os esportes</option>{options.sports.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
      <label className="input-group">Arena<select className="input" value={arena} onChange={e => { setArena(e.target.value); setOffset(0); }}><option value="">Todas as arenas</option>{options.arenas.map(a => <option value={a.id} key={a.id}>{a.name}{a.isDemo ? ' · Demo' : ''}</option>)}</select></label>
      {(arenaOffset > 0 || options.hasMore) && <nav className="read-pagination" aria-label="Catálogo de arenas"><Button variant="quiet" size="small" disabled={!arenaOffset} onClick={() => { setArenaOffset(arenaOffset - 24); setArena(''); setOffset(0); }}>Arenas anteriores</Button><Button variant="quiet" size="small" disabled={!options.hasMore} onClick={() => { setArenaOffset(arenaOffset + 24); setArena(''); setOffset(0); }}>Mais arenas</Button></nav>}
      <label className="input-group">Nível<select className="input" value={level} onChange={e => { setLevel(e.target.value); setOffset(0); }}><option value="">Todos os níveis</option>{['Iniciante', 'Intermediário', 'Avançado'].map(l => <option key={l}>{l}</option>)}</select></label>
      <label className="connected-checkbox"><input type="checkbox" checked={active} onChange={e => { setActive(e.target.checked); setOffset(0); }} />Na areia agora · check-in ativo</label>
      {(sport || arena || level || active) && <Button variant="quiet" size="small" onClick={() => { setSport(''); setArena(''); setLevel(''); setActive(false); setOffset(0); }}>Limpar filtros</Button>}
    </fieldset></div></section>}
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <><ConnectedSource /><div className="list-heading"><span>{players.length} {players.length === 1 ? 'jogador' : 'jogadores'} nesta página</span><Button size="small" variant="quiet" disabled={refreshing} onClick={refresh}>{refreshing ? 'Atualizando…' : 'Atualizar'}</Button></div>
      {players.map(p => <article className="connected-panel" key={p.id}><Link className="post-person" href={`/perfil/${p.username}`}><span className="read-profile-avatar"><UserRound size={28} aria-hidden="true" /></span><span><strong>{p.display_name}</strong><small>@{p.username}</small></span></Link>{p.is_demo && <p className="form-note">Jogador de demonstração</p>}<p className="location-line">{[p.neighborhood, p.city].filter(Boolean).join(' · ')}</p><p className="profile-bio">{p.bio}</p><p className="sport-label"><SportIcon sport={p.sport_slug} />{p.sport_name} · {p.level}</p><p className={`availability ${p.available ? 'available' : ''}`}><span />{p.available ? 'Disponível pra jogar' : 'Sem disponibilidade marcada'}</p>{p.arena_slug && p.expires_at && Date.parse(p.expires_at) > now && <p><Link href={`/arenas/${p.arena_slug}`}>Check-in em {p.arena_name}</Link> · até {new Date(p.expires_at!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}<ConnectionButton playerId={p.id} connected={p.connected} refresh={refresh} /></article>)}
      {!players.length && <EmptyState title="Sua turma ainda vai aparecer.">Nenhum perfil completo corresponde aos filtros. Experimente outro esporte ou arena.</EmptyState>}
      {(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de jogadores"><Button variant="secondary" size="small" disabled={!offset} onClick={() => setOffset(offset - 24)}>Anterior</Button><span>Página {offset / 24 + 1}</span><Button variant="secondary" size="small" disabled={!data.hasMore} onClick={() => setOffset(offset + 24)}>Próxima</Button></nav>}
    </>}
  </>;
}
export function ConnectedPlayer({ username }: { username: string }) {
  const { state, retry, refresh } = useRemoteRead(`resource=player&username=${encodeURIComponent(username)}`);
  const data = state.status === 'success' && state.data.kind === 'player' ? state.data : null;
  return <><PageHeading eyebrow="ME ACHA NO PICO" title="Perfil do jogador." />
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <><ConnectedSource /><section className="connected-panel"><div className="read-profile-identity"><span className="read-profile-avatar"><UserRound size={40} aria-hidden="true" /></span><div><h2>{data.profile.name}</h2><p>@{data.profile.username}</p></div></div>{data.profile.isDemo && <p className="form-note">Jogador de demonstração</p>}<p className="location-line">{[data.profile.neighborhood, data.profile.city].filter(Boolean).join(' · ')}</p><p className="profile-bio">{data.profile.bio || 'A bio ainda não foi adicionada.'}</p><div className="profile-sports">{data.profile.sports.map(s => <p key={s.sport.id}><SportIcon sport={s.sport.slug} />{s.sport.name} · {s.level}{s.isPrimary ? ' · Principal' : ''}</p>)}</div><p className={`availability ${data.profile.available ? 'available' : ''}`}><span />{data.profile.available ? 'Disponível pra jogar' : 'Sem disponibilidade marcada'}</p>{data.own ? <Link href="/perfil">Editar meu perfil</Link> : <ConnectionButton playerId={data.profile.id} connected={data.connected} refresh={refresh} />}</section></>}
  </>;
}

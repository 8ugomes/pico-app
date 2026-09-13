'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, UsersRound, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDemo } from './DemoProvider';
import { PageHeading, EmptyState, SearchField } from './SocialUI';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { PlayerCard } from './PlayerCard';
import { normalizeSearch, visibleDemoPosts } from '@/lib/demo-state';

export function DemoCommunities({ arenaId }: { arenaId?: string }) {
  const { state } = useDemo();
  const [mine, setMine] = useState(true), [search, setSearch] = useState('');
  const groups = state.communities.filter(c => (arenaId ? c.arenaId === arenaId : !mine || c.members.includes(state.currentUserId) || c.pending.includes(state.currentUserId)) && normalizeSearch(c.name).includes(normalizeSearch(search)));
  return <>
    {!arenaId && <><PageHeading eyebrow="ENCONTRE QUEM JOGA COM VOCÊ" title="Comunidades" /><p className="page-intro">Grupos ilustrativos para explorar como participar e continuar a conversa.</p><div className="feed-tabs"><button className={mine ? 'active-tab' : ''} aria-pressed={mine} onClick={() => setMine(true)}>Minhas comunidades</button><button data-tour="community-explore" className={!mine ? 'active-tab' : ''} aria-pressed={!mine} onClick={() => setMine(false)}>Explorar</button></div></>}
    <div className="community-toolbar"><SearchField label="Buscar comunidades" placeholder="Nome da comunidade" value={search} onChange={setSearch} /></div>
    <div className="community-list">{groups.map(c => <article className="community-card" key={c.id}><Link className="community-card-title" href={`/comunidades/${c.slug}`}><span className="community-symbol"><UsersRound size={22} aria-hidden="true" /></span><h2>{c.name}</h2><ArrowRight size={18} aria-hidden="true" /></Link><p className="community-purpose">{c.description}</p><p className="community-meta">{c.visibility === 'private' ? 'Somente participantes ativos' : 'Pessoas do Pico'} · {c.entryMode === 'approval' ? 'Entrada por aprovação' : 'Entrada aberta'} · Demo</p>{c.members.includes(state.currentUserId) && <p className="community-membership">Você participa nesta demonstração</p>}{c.pending.includes(state.currentUserId) && <p className="community-membership">Pedido simulado em análise</p>}</article>)}</div>
    {!groups.length && <><EmptyState title="Nenhuma comunidade nesta seleção.">Explore outros grupos ou limpe a busca.</EmptyState><Button variant="secondary" onClick={() => { setMine(false); setSearch(''); }}>Explorar comunidades</Button></>}
    {!arenaId && <footer className="community-create"><div><h2>Quer criar uma comunidade real?</h2><p>É preciso uma conta com e-mail confirmado. Esta demonstração não cria grupos no serviço.</p></div><Link className="journey-text-link" href="/signup">Criar minha conta <ArrowRight size={16} aria-hidden="true" /></Link></footer>}
  </>;
}
export function DemoCommunity({ slug }: { slug: string }) {
  const { state, dispatch } = useDemo();
  const c = state.communities.find(group => group.slug === slug);
  if (!c) return <><Link className="detail-back" href="/comunidades">← Comunidades</Link><EmptyState title="Comunidade fora desta demonstração.">Explore um dos grupos ilustrativos.</EmptyState></>;
  const member = c.members.includes(state.currentUserId), pending = c.pending.includes(state.currentUserId);
  const readable = c.visibility === 'beta' || member;
  const arena = state.arenas.find(a => a.id === c.arenaId);
  const posts = visibleDemoPosts(state).filter(p => p.communityIds?.includes(c.id));
  return <><Link className="detail-back" href="/comunidades">← Comunidades</Link><header className="community-identity"><PageHeading eyebrow="COMUNIDADE · DEMONSTRAÇÃO" title={c.name} /><p className="community-description">{c.description}</p>{arena && <Link className="community-place" href={`/arenas/${arena.slug}`}>{arena.name}</Link>}<p data-tour="community-conditions" className="community-conditions">{c.visibility === 'private' ? 'Conteúdo só para participantes ativos' : 'Conteúdo para pessoas do Pico'} · {c.entryMode === 'approval' ? 'entrada por aprovação' : 'entrada aberta'}</p></header>
    <div className="community-participation">{member ? <><p className="membership-confirmed" role="status">Você participa nesta demonstração.</p><details><summary>Opções de participação</summary><Button variant="quiet" onClick={() => dispatch({ type: 'community_membership', id: c.id, join: false })}>Sair da comunidade</Button></details></> : pending ? <p role="status">Pedido simulado em análise. Nenhum pedido foi enviado para outra pessoa. Isso não libera o conteúdo privado.</p> : <Button onClick={() => dispatch({ type: 'community_membership', id: c.id, join: true })}>{c.entryMode === 'approval' ? 'Simular pedido de participação' : 'Participar nesta demonstração'}</Button>}</div>
    {readable ? <><details className="community-about"><summary>Sobre o grupo e participantes</summary><div><h2>Modalidades</h2><p>{c.sports.map(id => state.sports.find(s => s.id === id)?.name).join(' · ')}</p><h2>Regras da comunidade</h2><p>{c.rules}</p><h2>Quem participa</h2>{state.players.filter(p => c.members.includes(p.id)).map(p => <PlayerCard key={p.id} player={p} />)}</div></details>{member && <PostComposer fixedCommunityId={c.id} />}<div className="list-heading"><h2>Mural</h2></div><div className="post-list">{posts.map(p => <PostCard key={p.id} post={p} />)}</div>{!posts.length && <EmptyState title="A conversa pode começar aqui.">Ainda não há publicações ilustrativas neste grupo.</EmptyState>}</> : <section className="community-private"><LockKeyhole size={24} aria-hidden="true" /><h2>Um espaço reservado ao grupo</h2><p>A demonstração mantém o mural e os participantes privados enquanto o pedido está pendente.</p><Link href="/comunidades">Conhecer outras comunidades</Link></section>}
  </>;
}

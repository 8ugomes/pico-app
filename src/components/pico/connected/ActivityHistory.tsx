'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useEntity } from './useEntity';
type Place = { id: string; name: string; slug: string };
export function ProfilePlaces({ playerId }: { playerId: string }) {
  const { data, error, reload } = useEntity<{ own: boolean; arenas: Place[]; communities: Place[] }>(`/api/activity?kind=places&player=${playerId}`);
  return <section className="profile-places"><h2>Vínculos no Pico</h2><p>{data?.own ? 'Arenas que você acompanha e comunidades de que participa.' : 'Lugares e grupos disponíveis para você consultar.'}</p>{error && <><p role="alert">{error}</p><Button variant="secondary" onClick={reload}>Tentar novamente</Button></>}{!data && !error && <p role="status">Carregando vínculos…</p>}{data && <><h3>Arenas acompanhadas</h3><div className="context-links">{data.arenas.map(a => <Link href={`/arenas/${a.slug}`} key={a.id}>{a.name}</Link>)}</div>{!data.arenas.length && <p>Nenhuma arena acompanhada disponível. {data.own && <Link className="journey-text-link" href="/arenas">Explorar arenas</Link>}</p>}<h3>Comunidades</h3><div className="context-links">{data.communities.map(c => <Link key={c.id} href={`/comunidades/${c.slug}`}>{c.name}</Link>)}</div>{!data.communities.length && <p>Nenhuma comunidade disponível para sua conta. {data.own && <Link className="journey-text-link" href="/comunidades">Conhecer comunidades</Link>}</p>}</>}</section>;
}
export function CommonPlayers() {
  const { data, error, reload } = useEntity<{ id: string; username: string; display_name: string; arena_in_common: boolean; community_in_common: boolean; sport_in_common: boolean }[]>('/api/activity?kind=common');
  if (error) return <p className="input-hint">As afinidades não carregaram. <Button variant="quiet" size="small" onClick={reload}>Tentar novamente</Button></p>;
  if (!data?.length) return null;
  return <section className="common-people"><h2>Algo em comum</h2><p>Por esportes e vínculos visíveis no Pico.</p><ul className="member-rows">{data.map(p => <li key={p.id}><Link href={`/perfil/${p.username}`}><span className="member-initial" aria-hidden="true">{p.display_name.slice(0, 1)}</span><span>{p.display_name}<small>{[p.arena_in_common && 'Arena em comum', p.community_in_common && 'Comunidade em comum', p.sport_in_common && 'Mesmo esporte'].filter(Boolean).join(' · ')}</small></span></Link></li>)}</ul></section>;
}

import Link from 'next/link';
import { ArrowRight, MapPin, UsersRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

type Place = { id: string; name: string; slug: string };
export type HomePlaces = { arenas: Place[]; communities: Place[] };

/** Only receives the viewer's existing, authorized memberships. No inferred presence. */
export function HomeContexts({ places, demo = false }: { places: HomePlaces; demo?: boolean }) {
  const hasPlaces = places.arenas.length + places.communities.length > 0;
  return <section className="home-contexts" aria-label="Seus caminhos no Pico">
    <header className="home-intro">
      <h1>Seu Pico.</h1>
      <p>{hasPlaces ? 'Volte aos seus lugares e continue a conversa.' : 'Encontre pessoas, conheça uma turma e faça parte da conversa.'}</p>
    </header>
    {hasPlaces ? <div className="home-place-groups">
      <h2 className="home-places-label">Suas comunidades e arenas</h2>
      <div className="context-links">
        {places.communities.slice(0, 3).map(c => <Link href={`/comunidades/${c.slug}`} key={c.id}><UsersRound size={18} aria-hidden="true" /><span>{c.name}</span></Link>)}
        {places.arenas.slice(0, 3).map(a => <Link href={`/arenas/${a.slug}`} key={a.id}><MapPin size={18} aria-hidden="true" /><span>{a.name}</span></Link>)}
      </div>
    </div> : <div className="home-first-step"><span className="community-symbol"><UsersRound size={24} aria-hidden="true" /></span><div><h2>Comece por uma comunidade</h2><p>Conheça o propósito do grupo e como participar.</p><div className="home-first-actions"><Link className={buttonVariants({ size: 'small' })} href="/comunidades">Conhecer comunidades</Link><Link href="/descobrir">Encontrar pessoas <ArrowRight size={16} aria-hidden="true" /></Link></div></div></div>}
    {demo && <p className="input-hint">Vínculos ilustrativos. As ações da demonstração ficam nesta sessão.</p>}
  </section>;
}

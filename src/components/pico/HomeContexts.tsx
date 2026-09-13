import Link from 'next/link';
import { ArrowRight, MapPin, UsersRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

type Place = { id: string; name: string; slug: string };
export type HomePlaces = { arenas: Place[]; communities: Place[] };

/** Only receives the viewer's existing, authorized memberships. No inferred presence. */
export function HomeContexts({ places, demo = false }: { places: HomePlaces; demo?: boolean }) {
  const hasPlaces = places.arenas.length + places.communities.length > 0;
  return <section className="home-contexts" aria-label="Seus caminhos no Pico">
    <header className="home-intro"><h1>Seu Pico.</h1></header>
    {!places.arenas.length && <div className="home-first-step"><div>
      <h2>Onde você joga?</h2>
      <p>Encontre sua arena e a turma de lá.</p>
      <Link className={buttonVariants({ size: 'small' })} href="/arenas">Encontrar minha arena <ArrowRight size={17} aria-hidden="true" /></Link>
    </div></div>}
    {hasPlaces && <div className="home-place-groups">
      <h2 className="home-places-label">Meus Picos</h2>
      <div className="context-links">
        {places.arenas.slice(0, 3).map(a => <Link href={`/arenas/${a.slug}`} key={a.id}><MapPin size={18} aria-hidden="true" /><span>{a.name}</span></Link>)}
        {places.communities.slice(0, 3).map(c => <Link href={`/comunidades/${c.slug}`} key={c.id}><UsersRound size={18} aria-hidden="true" /><span>{c.name}</span></Link>)}
      </div>
    </div>}
    {demo && <p className="input-hint">Vínculos ilustrativos. Ações só nesta sessão.</p>}
  </section>;
}

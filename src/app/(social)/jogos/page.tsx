import type { Metadata } from 'next';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedGames } from '@/components/pico/connected/ConnectedGames';
import { GamesView } from '@/components/pico/GamesView';
import { mock } from '@/data/mock';
export const metadata: Metadata = { title: 'Meus jogos' };
export default async function GamesPage({ searchParams }: PageProps<'/jogos'>) {
  const { arena } = await searchParams;
  const slug = typeof arena === 'string' ? arena : undefined;
  if (getSupabaseEnvironment().status !== 'demo') return <ConnectedGames key={slug ?? 'journal'} initialSlug={slug} />;
  return <GamesView key={slug ?? 'journal'} initialArenaId={mock.arenas.find(a => a.slug === slug)?.id} />;
}

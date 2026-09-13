import { redirect } from 'next/navigation';
// Compatibility for saved links only; no presence UI or action remains.
export default async function RetiredPresencePage({ searchParams }: PageProps<'/checkin'>) {
  const { arena } = await searchParams;
  redirect(typeof arena === 'string' ? `/jogos?arena=${encodeURIComponent(arena)}` : '/jogos');
}

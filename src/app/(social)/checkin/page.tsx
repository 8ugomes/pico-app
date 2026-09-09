import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedCheckin } from '@/components/pico/connected/ConnectedCheckin';
import type { Metadata } from "next";
import { CheckinView } from "@/components/pico/CheckinView";
import { mock } from "@/data/mock";
export const metadata: Metadata = { title: "Check-in" };
export default async function CheckinPage({ searchParams }: PageProps<"/checkin">) {
  const { arena } = await searchParams;
  if (getSupabaseEnvironment().status !== 'demo') return <ConnectedCheckin initialSlug={typeof arena === 'string' ? arena : undefined} />;
  const initial = mock.arenas.find(a => a.slug === arena);
  return <CheckinView key={initial?.id ?? "choose"} initialArenaId={initial?.id} />;
}

import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedPlayer } from '@/components/pico/connected/ConnectedDiscovery';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mock } from "@/data/mock";
import { ProfileView } from "@/components/pico/ProfileView";
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: PageProps<"/perfil/[username]">): Promise<Metadata> {
  const { username } = await params;
  if (getSupabaseEnvironment().status !== 'demo') return { title: 'Perfil do jogador' };
  return { title: mock.players.find(p => p.username === username)?.name ?? "Perfil não encontrado" };
}
export default async function PlayerPage({ params }: PageProps<"/perfil/[username]">) {
  const { username } = await params;
  if (getSupabaseEnvironment().status !== 'demo') return <ConnectedPlayer key={username} username={username} />;
  const player = mock.players.find(p => p.username === username);
  if (!player) notFound();
  return <ProfileView key={player.id} playerId={player.id} />;
}

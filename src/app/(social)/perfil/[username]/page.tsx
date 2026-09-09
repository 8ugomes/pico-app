import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mock } from "@/data/mock";
import { ProfileView } from "@/components/pico/ProfileView";
export function generateStaticParams() { return mock.players.map(p => ({ username: p.username })); }
export async function generateMetadata({ params }: PageProps<"/perfil/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: mock.players.find(p => p.username === username)?.name ?? "Perfil não encontrado" };
}
export default async function PlayerPage({ params }: PageProps<"/perfil/[username]">) {
  const { username } = await params;
  const player = mock.players.find(p => p.username === username);
  if (!player) notFound();
  return <ProfileView key={player.id} playerId={player.id} />;
}

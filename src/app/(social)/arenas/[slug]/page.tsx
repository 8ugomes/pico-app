import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedArena } from '@/components/pico/connected/ConnectedArenas';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mock } from "@/data/mock";
import { ArenaDetailView } from "@/components/pico/ArenaDetailView";
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: PageProps<"/arenas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (getSupabaseEnvironment().status !== 'demo') return { title: 'Arena', description: 'Conheça os esportes e o lugar do seu próximo encontro.' };
  const arena = mock.arenas.find(a => a.slug === slug);
  return { title: arena?.name ?? "Arena não encontrada", description: arena?.description };
}
export default async function ArenaPage({ params }: PageProps<"/arenas/[slug]">) {
  const { slug } = await params;
  if (getSupabaseEnvironment().status !== 'demo') return <ConnectedArena key={slug} slug={slug} />;
  const arena = mock.arenas.find(a => a.slug === slug);
  if (!arena) notFound();
  return <ArenaDetailView arena={arena} />;
}

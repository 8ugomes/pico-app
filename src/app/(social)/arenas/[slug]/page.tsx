import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mock } from "@/data/mock";
import { ArenaDetailView } from "@/components/pico/ArenaDetailView";
export function generateStaticParams() { return mock.arenas.map(a => ({ slug: a.slug })); }
export async function generateMetadata({ params }: PageProps<"/arenas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const arena = mock.arenas.find(a => a.slug === slug);
  return { title: arena?.name ?? "Arena não encontrada", description: arena?.description };
}
export default async function ArenaPage({ params }: PageProps<"/arenas/[slug]">) {
  const { slug } = await params;
  const arena = mock.arenas.find(a => a.slug === slug);
  if (!arena) notFound();
  return <ArenaDetailView arena={arena} />;
}

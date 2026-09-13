'use client';
import Link from 'next/link';
import { useDemo } from './DemoProvider';
import { visibleDemoPosts } from '@/lib/demo-state';
import { PostCard } from './PostCard';
import { EmptyState, PageHeading } from './SocialUI';
export function DemoPublication({ id }: { id: string }) {
  const { state } = useDemo();
  const post = visibleDemoPosts(state).find(p => p.id === id);
  return <><Link className="detail-back" href="/feed">← Início</Link><PageHeading eyebrow="DEMONSTRAÇÃO" title="Publicação" />{post ? <PostCard post={post} /> : <EmptyState title="Esta publicação não está disponível.">Publicações locais somem ao recarregar; conteúdo privado depende da participação no grupo.</EmptyState>}</>;
}

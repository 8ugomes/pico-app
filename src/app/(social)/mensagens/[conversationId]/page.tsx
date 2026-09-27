import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessageThreadView } from '@/components/pico/MessagesView';

export const metadata: Metadata = { title: 'Conversa', robots: { index: false, follow: false } };
export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(conversationId)) notFound();
  return <MessageThreadView conversationId={conversationId} />;
}

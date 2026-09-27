import type { Metadata } from 'next';
import { MessagesView } from '@/components/pico/MessagesView';

export const metadata: Metadata = { title: 'Mensagens', robots: { index: false, follow: false } };
export default function MessagesPage() { return <MessagesView />; }

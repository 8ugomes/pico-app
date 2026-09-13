import { ConnectedFeed } from '@/components/pico/connected/ConnectedFeed';
import { DemoPublication } from '@/components/pico/DemoPublication';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return getSupabaseEnvironment().status === 'demo' ? <DemoPublication id={id} /> : <ConnectedFeed postId={id} readOnly />; }

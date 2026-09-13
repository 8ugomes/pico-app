import { Community } from '@/components/pico/connected/Communities';
import { DemoCommunity } from '@/components/pico/DemoCommunities';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return getSupabaseEnvironment().status === 'demo' ? <DemoCommunity slug={slug} /> : <Community slug={slug} />; }

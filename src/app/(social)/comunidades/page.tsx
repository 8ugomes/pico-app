import { Communities } from '@/components/pico/connected/Communities';
import { DemoCommunities } from '@/components/pico/DemoCommunities';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
export const dynamic = 'force-dynamic';
export default function Page() { return getSupabaseEnvironment().status === 'demo' ? <DemoCommunities /> : <Communities />; }

import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedDiscovery } from '@/components/pico/connected/ConnectedDiscovery';
import type { Metadata } from "next";
import { DiscoverView } from "@/components/pico/DiscoverView";
export const metadata: Metadata = { title: "Descobrir pessoas" };
export const dynamic = 'force-dynamic';
export default function DiscoverPage() { return getSupabaseEnvironment().status === 'demo' ? <DiscoverView /> : <ConnectedDiscovery />; }

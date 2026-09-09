import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedArenas } from '@/components/pico/connected/ConnectedArenas';
import type { Metadata } from "next";
import { ArenasView } from "@/components/pico/ArenasView";
export const metadata: Metadata = { title: "Arenas" };
export const dynamic = 'force-dynamic';
export default function ArenasPage() {
  return getSupabaseEnvironment().status === 'demo' ? <ArenasView /> : <ConnectedArenas />;
}

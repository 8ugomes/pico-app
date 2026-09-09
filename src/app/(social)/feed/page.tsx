import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedFeed } from '@/components/pico/connected/ConnectedFeed';
import type { Metadata } from "next";
import { FeedView } from "@/components/pico/FeedView";
export const metadata: Metadata = { title: "Seu feed" };
export const dynamic = 'force-dynamic';
export default function FeedPage() { return getSupabaseEnvironment().status === 'demo' ? <FeedView /> : <ConnectedFeed />; }

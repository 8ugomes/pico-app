import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { ConnectedProfile } from '@/components/pico/connected/ConnectedProfile';
import type { Metadata } from "next";
import { ProfileView } from "@/components/pico/ProfileView";
export const metadata: Metadata = { title: "Seu perfil" };
export const dynamic = 'force-dynamic';
export default function ProfilePage() {
  return getSupabaseEnvironment().status === 'demo' ? <ProfileView /> : <ConnectedProfile />;
}

import { OfficialWelcome } from '@/components/pico/OfficialWelcome';
import { GuidedOnboarding } from '@/components/pico/GuidedOnboarding';
import { AccessGate } from '@/components/pico/AccessGate';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import type { ReactNode } from "react";
import { DemoProvider } from "@/components/pico/DemoProvider";
import { AppShell } from "@/components/pico/AppShell";

export default function SocialLayout({ children }: { children: ReactNode }) {
  const environment = getSupabaseEnvironment().status;
  const content = <GuidedOnboarding demo={environment === 'demo'}>{environment !== 'demo' && <OfficialWelcome />}{children}</GuidedOnboarding>;
  return <DemoProvider><AppShell environment={environment}>{environment === 'demo' ? content : <AccessGate>{content}</AccessGate>}</AppShell></DemoProvider>;
}

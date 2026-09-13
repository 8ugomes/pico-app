import { OfficialWelcome } from '@/components/pico/OfficialWelcome';
import { GuidedOnboarding } from '@/components/pico/GuidedOnboarding';
import { AccessGate } from '@/components/pico/AccessGate';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import type { ReactNode } from "react";
import { DemoProvider } from "@/components/pico/DemoProvider";
import { AppShell } from "@/components/pico/AppShell";
import { OwnProfileProvider } from '@/components/pico/connected/OwnProfile';
import { ProfileSetupGate } from '@/components/pico/ProfileSetupGate';

export default function SocialLayout({ children }: { children: ReactNode }) {
  const environment = getSupabaseEnvironment().status;
  const content = <GuidedOnboarding demo={environment === 'demo'}>{environment !== 'demo' && <OfficialWelcome />}{children}</GuidedOnboarding>;
  const shell = <AppShell environment={environment}>{environment === 'demo' ? content : <AccessGate><ProfileSetupGate>{content}</ProfileSetupGate></AccessGate>}</AppShell>;
  return <DemoProvider>{environment === 'demo' ? shell : <OwnProfileProvider>{shell}</OwnProfileProvider>}</DemoProvider>;
}

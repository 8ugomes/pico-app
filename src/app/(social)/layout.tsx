import '../social-bundle.css';
import '../messages.css';
import { OfficialWelcome } from '@/components/pico/OfficialWelcome';
import { GuidedOnboarding } from '@/components/pico/GuidedOnboarding';
import { AccessGate } from '@/components/pico/AccessGate';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import type { ReactNode } from "react";
import { DemoProvider } from "@/components/pico/DemoProvider";
import { AppShell } from "@/components/pico/AppShell";
import { OwnProfileProvider } from '@/components/pico/connected/OwnProfile';
import { NotificationsProvider } from '@/components/pico/NotificationsProvider';
import { ProfileSetupGate } from '@/components/pico/ProfileSetupGate';
import { MessagesProvider } from '@/components/pico/MessagesProvider';
import { directMessagesEnabled } from '@/lib/features';

export default function SocialLayout({ children }: { children: ReactNode }) {
  const environment = getSupabaseEnvironment().status;
  const content = <GuidedOnboarding demo={environment === 'demo'}>{environment !== 'demo' && <OfficialWelcome />}{children}</GuidedOnboarding>;
  const shell = <AppShell environment={environment}>{environment === 'demo' ? content : <ProfileSetupGate>{content}</ProfileSetupGate>}</AppShell>;
  const providers = <NotificationsProvider demo={environment === 'demo'}><MessagesProvider enabled={directMessagesEnabled()} demo={environment === 'demo'}>{environment === 'demo' ? shell : <OwnProfileProvider>{shell}</OwnProfileProvider>}</MessagesProvider></NotificationsProvider>;
  return <DemoProvider>{environment === 'demo' ? providers : <AccessGate>{providers}</AccessGate>}</DemoProvider>;
}

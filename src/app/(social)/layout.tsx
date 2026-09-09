import { getSupabaseEnvironment } from '@/lib/supabase/config';
import type { ReactNode } from "react";
import { DemoProvider } from "@/components/pico/DemoProvider";
import { AppShell } from "@/components/pico/AppShell";

export default function SocialLayout({ children }: { children: ReactNode }) {
  return <DemoProvider><AppShell environment={getSupabaseEnvironment().status}>{children}</AppShell></DemoProvider>;
}

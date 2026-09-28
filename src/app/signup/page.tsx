import type { Metadata } from "next";
import { AuthPage } from "@/components/pico/AuthPage";
import { safeNext } from "@/lib/auth/navigation";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  return <AuthPage mode="signup" next={safeNext(params.next)} />;
}

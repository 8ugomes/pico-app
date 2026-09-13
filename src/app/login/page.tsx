import type { Metadata } from "next";
import { AuthPage } from "@/components/pico/AuthPage";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return <AuthPage mode="login" confirmationError={params.error === "confirmation"} passwordUpdated={params.password === "updated"} />;
}

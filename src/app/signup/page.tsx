import type { Metadata } from "next";
import { AuthPage } from "@/components/pico/AuthPage";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return <AuthPage mode="signup" />;
}

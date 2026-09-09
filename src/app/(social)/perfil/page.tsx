import type { Metadata } from "next";
import { ProfileView } from "@/components/pico/ProfileView";
export const metadata: Metadata = { title: "Seu perfil" };
export default function ProfilePage() { return <ProfileView />; }

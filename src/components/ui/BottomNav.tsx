"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, UsersRound, Compass, UserRound, Plus } from "lucide-react";

export const socialLinks = [
  { href: "/feed", label: "Feed", icon: House },
  { href: "/comunidades", label: "Turmas", icon: UsersRound },
  { href: "/checkin", label: "Check-in", icon: Plus },
  { href: "/descobrir", label: "Descobrir", icon: Compass },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];
export function BottomNav({ desktop = false }: { desktop?: boolean }) {
  const path = usePathname();
  return <nav className={desktop ? "desktop-navigation" : "bottom-navigation"} aria-label={desktop ? "Navegação principal" : "Navegação mobile"}>
    {socialLinks.map(({ href, label, icon: Icon }) => {
      const current = path === href || path.startsWith(href + "/");
      return <Link key={href} href={href} className={`nav-item ${current ? "nav-current" : ""} ${href === "/checkin" ? "nav-checkin" : ""}`} aria-current={current ? "page" : undefined}>
        <span className="nav-icon"><Icon size={22} strokeWidth={current ? 2 : 1.7} aria-hidden="true" /></span><span>{label}</span>
      </Link>;
    })}
  </nav>;
}

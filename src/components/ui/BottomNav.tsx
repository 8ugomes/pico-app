"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { House, UsersRound, Compass, UserRound, MapPin } from "lucide-react";

export const socialLinks = [
  { href: "/feed", label: "Início", icon: House },
  { href: "/descobrir", label: "Pessoas", icon: Compass },
  { href: "/comunidades", label: "Comunidades", icon: UsersRound },
  { href: "/arenas", label: "Arenas", icon: MapPin },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];
export function BottomNav({ desktop = false }: { desktop?: boolean }) {
  const path = usePathname();
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (desktop || !navigation.current) return;
    const element = navigation.current;
    // Text enlargement can wrap navigation into rows; keep the last action clear.
    const measure = () => document.documentElement.style.setProperty('--pico-nav-height', `${element.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--pico-nav-height'); };
  }, [desktop]);
  return <nav ref={navigation} className={desktop ? "desktop-navigation" : "bottom-navigation"} aria-label={desktop ? "Navegação principal" : "Navegação mobile"}>
    {socialLinks.map(({ href, label, icon: Icon }) => {
      const current = path === href || path.startsWith(href + "/") || (href === "/perfil" && path === "/jogos");
      return <Link key={href} href={href} className={`nav-item ${current ? "nav-current" : ""}`} aria-current={current ? "page" : undefined}>
        <span className="nav-icon"><Icon size={22} strokeWidth={current ? 2 : 1.7} aria-hidden="true" /></span><span>{label}</span>
      </Link>;
    })}
  </nav>;
}

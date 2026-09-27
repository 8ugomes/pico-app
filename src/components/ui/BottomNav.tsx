"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { House, UsersRound, Compass, UserRound, MapPin } from "lucide-react";
import { NotificationLink } from '@/components/pico/NotificationLink';
import { MessageLink } from '@/components/pico/MessageLink';

export const socialLinks = [
  { href: "/feed", label: "Início", icon: House },
  { href: "/descobrir", label: "Pessoas", icon: Compass },
  { href: "/comunidades", label: "Comunidades", icon: UsersRound },
  { href: "/arenas", label: "Arenas", icon: MapPin },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

function NavIcon({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={`nav-icon ${pending ? 'nav-pending' : ''}`}>{children}<span className="nav-pending-dot" aria-hidden="true" /></span>;
}

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
        <NavIcon><Icon size={22} strokeWidth={current ? 2 : 1.7} aria-hidden="true" /></NavIcon><span>{label}</span>
      </Link>;
    })}
    {desktop && <NotificationLink desktop />}
    {desktop && <MessageLink desktop />}
  </nav>;
}

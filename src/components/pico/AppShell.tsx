"use client";
import { PwaStatus } from './PwaExperience';
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, UserRound } from "lucide-react";
import { Brand } from "./Brand";
import { BottomNav } from "@/components/ui/BottomNav";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";

export function AppShell({ children, environment = 'demo' }: { children: ReactNode; environment?: 'demo' | 'configured' | 'invalid' }) {
  const { me } = useDemo();
  const connected = environment !== 'demo';
  const profileIcon = <span className="read-account-icon"><UserRound size={20} aria-hidden="true" /></span>;
  return <div className="social-app">
    <aside className="app-sidebar"><Brand /><p className="sidebar-tagline">O ponto de encontro<br />da areia.</p><BottomNav desktop /><Link className="sidebar-profile" href="/perfil">{connected ? <>{profileIcon}<span><strong>Minha conta</strong><small>Seu perfil no Pico</small></span></> : <><PlayerAvatar player={me} /><span><strong>{me.name}</strong><small>Seu perfil de demonstração</small></span></>}</Link></aside>
    <div className="app-center">
      <header className="mobile-app-header"><Brand /><span className="header-location"><MapPin size={13} aria-hidden="true" /> {connected ? 'Encontre seu Pico' : 'São Paulo, SP'}</span><Link href="/perfil" aria-label="Abrir meu perfil">{connected ? profileIcon : <PlayerAvatar player={me} size="small" />}</Link></header>
      {connected ? <div className="demo-banner read-mode-banner"><span className="demo-indicator" />Pico <span>· acesso por aprovação</span></div> : <div className="demo-banner"><span className="demo-indicator" />Demonstração <span>· pessoas fictícias, ações nesta sessão</span></div>}
      <PwaStatus/><main id="main-content" className="social-main">{children}</main>
    </div>
    <aside className="community-sidebar">
      <section className="journey-rail"><p className="rail-eyebrow">DEPOIS DO JOGO</p><h2>Guarde o que viveu na areia.</h2><p>Em Meus jogos, arena, modalidade e data ficam só para você. Compartilhe quando quiser.</p><Link href="/jogos">Abrir Meus jogos <ArrowUpRight size={17} aria-hidden="true" /></Link></section>
      <div className="rail-footer"><span>Me acha no Pico.</span><Link href="/privacidade">Sobre seus dados <ArrowUpRight size={13} aria-hidden="true" /></Link><Link href="/instalar">Instalar o Pico</Link></div>
    </aside>
    <BottomNav />
  </div>;
}

"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, UserRound } from "lucide-react";
import { Brand } from "./Brand";
import { BottomNav } from "@/components/ui/BottomNav";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";

export function AppShell({ children, environment = 'demo' }: { children: ReactNode; environment?: 'demo' | 'configured' | 'invalid' }) {
  const { state, me } = useDemo();
  const connected = environment !== 'demo';
  const profileIcon = <span className="read-account-icon"><UserRound size={20} aria-hidden="true" /></span>;
  return <div className="social-app">
    <aside className="app-sidebar"><Brand /><p className="sidebar-tagline">O ponto de encontro<br />da areia.</p><BottomNav desktop /><Link className="sidebar-profile" href="/perfil">{connected ? <>{profileIcon}<span><strong>Minha conta</strong><small>Seu perfil no Pico</small></span></> : <><PlayerAvatar player={me} /><span><strong>{me.name}</strong><small>Seu perfil de demonstração</small></span></>}</Link></aside>
    <div className="app-center">
      <header className="mobile-app-header"><Brand /><span className="header-location"><MapPin size={13} aria-hidden="true" /> {connected ? 'Encontre seu Pico' : 'São Paulo, SP'}</span><Link href="/perfil" aria-label="Abrir meu perfil">{connected ? profileIcon : <PlayerAvatar player={me} size="small" />}</Link></header>
      {connected ? <div className="demo-banner read-mode-banner"><span className="demo-indicator" />Seu Pico <span>· encontre, jogue, compartilhe</span></div> : <div className="demo-banner"><span className="demo-indicator" />Demonstração <span>· pessoas fictícias, ações nesta sessão</span></div>}
      <main id="main-content" className="social-main">{children}</main>
    </div>
    <aside className="community-sidebar">
      <p className="rail-eyebrow">POR AQUI, A AREIA CONECTA.</p>
      <div className="rail-card"><span className="rail-small">SEU PRÓXIMO ENCONTRO</span><h2>Tem lugar pra você<br />na nossa roda.</h2><p>{connected ? "Conheça os lugares e esportes cadastrados no Pico." : "Descubra gente que joga o seu esporte, no seu ritmo."}</p><Link href={connected ? "/arenas" : "/descobrir"}>{connected ? "Explore as arenas" : "Encontre sua turma"} <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      {!connected && <section className="rail-activity"><h2>Na comunidade</h2>{state.activities.map(a => { const player = state.players.find(p => p.id === a.playerId)!; const arena = state.arenas.find(p => p.id === a.arenaId)!; return <Link key={a.id} href={`/arenas/${arena.slug}`} className="activity-row"><PlayerAvatar player={player} size="small" /><span><strong>{player.name.split(" ")[0]}</strong> {a.text}<small>{arena.name}</small></span></Link>; })}</section>}
      <div className="rail-footer"><span>Me acha no Pico.</span><Link href="/login">Entrar na minha conta <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
    </aside>
    <BottomNav />
  </div>;
}

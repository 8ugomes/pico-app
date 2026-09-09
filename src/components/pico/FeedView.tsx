"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Plus } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { PageHeading, SportFilter, EmptyState } from "./SocialUI";
import { PlayerAvatar } from "./PlayerAvatar";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import type { SportId } from "@/types/social";

export function FeedView() {
  const { state, present, me } = useDemo();
  const [sport, setSport] = useState<SportId | "all">("all");
  const [tab, setTab] = useState<"all" | "connections">("all");
  const mine = present.find(c => c.playerId === me.id);
  const arena = state.arenas.find(a => a.id === mine?.arenaId);
  const posts = state.posts.filter(p => (sport === "all" || p.sportId === sport) && (tab === "all" || p.authorId === me.id || state.connectedPlayerIds.includes(p.authorId)));
  return <>
    <PageHeading eyebrow="O PONTO DE ENCONTRO DA AREIA" title="Seu Pico, hoje." />
    <section className="presence-section" aria-labelledby="presence-title">
      <div className="section-heading"><h2 id="presence-title">Na areia agora <span className="live-dot" /></h2><Link href="/descobrir">Ver turma <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <div className="presence-row">
        <Link className="presence-person presence-you" href="/checkin"><span className="your-presence-icon"><Plus size={23} aria-hidden="true" /></span><span>Seu check-in</span></Link>
        {present.filter(c => c.playerId !== me.id).map(c => { const player = state.players.find(p => p.id === c.playerId)!; return <Link className="presence-person" key={c.id} href={`/perfil/${player.username}`}><PlayerAvatar player={player} size="large" active /><span>{player.name.split(" ")[0]}</span></Link>; })}
      </div>
    </section>
    <Link href="/checkin" className="feed-checkin-card"><span className="checkin-symbol"><MapPin size={23} aria-hidden="true" /></span><div><span>{mine ? "VOCÊ TÁ NO PICO" : "BORA PRA AREIA?"}</span><h2>{mine ? arena?.name : "O próximo jogo começa com você."}</h2><p>{mine ? "Sua turma já pode te encontrar por aqui." : "Dê um check-in e encontre sua turma."}</p></div><ArrowUpRight size={21} aria-hidden="true" /></Link>
    <div className="feed-tabs" role="group" aria-label="Origem dos posts"><button type="button" className={tab === "all" ? "active-tab" : ""} aria-pressed={tab === "all"} onClick={() => setTab("all")}>Para você</button><button type="button" className={tab === "connections" ? "active-tab" : ""} aria-pressed={tab === "connections"} onClick={() => setTab("connections")}>Sua turma</button></div>
    <SportFilter value={sport} onChange={setSport} />
    <PostComposer />
    <div className="post-list">{posts.length ? posts.map(p => <PostCard post={p} key={p.id} />) : <EmptyState title="A resenha ainda vai começar.">Troque o esporte ou conecte-se com mais pessoas para encontrar posts por aqui.</EmptyState>}</div>
  </>;
}

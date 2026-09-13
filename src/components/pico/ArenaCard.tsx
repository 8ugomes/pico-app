"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Arena } from "@/types/social";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { SportLabel } from "./SocialUI";

export function ArenaCard({ arena }: { arena: Arena }) {
  const { state } = useDemo();
  const members = state.players.filter(p => (p.id === state.currentUserId ? state.followedArenaIds : p.arenaIds).includes(arena.id)).slice(0, 3);
  return <article className="arena-card"><Link href={`/arenas/${arena.slug}`}>
    <div className="arena-card-photo"><Image src={arena.image} alt={`Ilustração da comunidade ${arena.name}.`} width={1440} height={960} style={{ objectPosition: arena.imagePosition }} sizes="(max-width: 700px) 100vw, 600px" /><span className="arena-label-badge">Arena de demonstração</span><span className="arena-open-icon"><ArrowUpRight size={20} aria-hidden="true" /></span></div>
    <div className="arena-card-content"><h2>{arena.name}</h2><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood} · São Paulo</p><div className="arena-sports">{arena.sports.map(s => <SportLabel key={s} sport={s} />)}</div><div className="arena-card-community"><div className="mini-avatar-stack">{members.map(p => <PlayerAvatar key={p.id} player={p} size="small" />)}</div><span>Pessoas que acompanham esta arena</span></div></div>
  </Link></article>;
}

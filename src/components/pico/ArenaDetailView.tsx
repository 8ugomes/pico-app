"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Plus, Check, Droplets } from "lucide-react";
import type { Arena } from "@/types/social";
import { useDemo } from "./DemoProvider";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import { PlayerCard } from "./PlayerCard";
import { SportLabel, EmptyState } from "./SocialUI";
import { buttonVariants } from "@/components/ui/Button";

export function ArenaDetailView({ arena }: { arena: Arena }) {
  const { state, dispatch, present } = useDemo();
  const [tab, setTab] = useState<"posts" | "people" | "about">("posts");
  const following = state.followedArenaIds.includes(arena.id);
  const people = present.filter(c => c.arenaId === arena.id).map(c => state.players.find(p => p.id === c.playerId)!);
  const posts = state.posts.filter(p => p.arenaId === arena.id);
  return <>
    <Link href="/arenas" className="detail-back"><ArrowLeft size={17} aria-hidden="true" /> Arenas</Link>
    <div className="arena-detail-photo"><Image src={arena.image} alt={`Ilustração de ${arena.name} em São Paulo.`} width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" preload /><span className="arena-live-badge"><span className="live-dot" />{people.length} na areia</span></div>
    <header className="arena-detail-header"><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood} · São Paulo</p><h1>{arena.name}</h1><div className="arena-sports">{arena.sports.map(s => <SportLabel sport={s} key={s} />)}</div><p className="community-count">{arena.members + Number(following)} pessoas · uma comunidade</p></header>
    <div className="arena-detail-actions"><Link className={buttonVariants()} href={`/checkin?arena=${arena.slug}`}><MapPin size={18} aria-hidden="true" />Fazer check-in</Link><button type="button" className={buttonVariants({ variant: "secondary" })} aria-pressed={following} onClick={() => dispatch({ type: "follow", arenaId: arena.id })}>{following ? <Check size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{following ? "Seguindo" : "Seguir"}</button></div>
    <div className="feed-tabs detail-tabs" role="group" aria-label="Conteúdo da arena">{([{ id: "posts", label: "Comunidade" }, { id: "people", label: `Na areia (${people.length})` }, { id: "about", label: "Sobre" }] as const).map(t => <button type="button" key={t.id} className={tab === t.id ? "active-tab" : ""} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {tab === "posts" && <div className="detail-content"><PostComposer fixedArenaId={arena.id} /><div className="post-list">{posts.map(p => <PostCard post={p} key={p.id} />)}{!posts.length && <EmptyState title="A comunidade começa com você.">Compartilhe o primeiro encontro nessa arena.</EmptyState>}</div></div>}
    {tab === "people" && <div className="people-list">{people.map(p => <PlayerCard key={p.id} player={p} />)}{!people.length && <EmptyState title="A areia tá esperando.">Se estiver por aqui, faça seu check-in e comece o próximo encontro.</EmptyState>}</div>}
    {tab === "about" && <section className="arena-about"><h2>Um pouco do nosso Pico</h2><p>{arena.description}</p><h3>Por aqui tem</h3><ul>{arena.amenities.map(a => <li key={a}><Droplets size={16} aria-hidden="true" />{a}</li>)}</ul><p className="form-note">Arena e imagem fictícias, criadas para explorar o Pico.</p></section>}
  </>;
}

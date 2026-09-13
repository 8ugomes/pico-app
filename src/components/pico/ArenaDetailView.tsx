"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Plus, Check, Droplets } from "lucide-react";
import type { Arena } from "@/types/social";
import { visibleDemoPosts } from "@/lib/demo-state";
import { DemoCommunities } from "./DemoCommunities";
import { useDemo } from "./DemoProvider";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import { PlayerCard } from "./PlayerCard";
import { SportLabel, EmptyState } from "./SocialUI";
import { buttonVariants } from "@/components/ui/Button";

export function ArenaDetailView({ arena }: { arena: Arena }) {
  const { state, dispatch } = useDemo();
  const [tab, setTab] = useState<"posts" | "people" | "about">("posts");
  const following = state.followedArenaIds.includes(arena.id);
  const people = state.players.filter(p => (p.id === state.currentUserId ? state.followedArenaIds : p.arenaIds).includes(arena.id));
  const posts = visibleDemoPosts(state).filter(p => p.arenaId === arena.id && p.distributedToArena !== false);
  return <>
    <Link href="/arenas" className="detail-back"><ArrowLeft size={17} aria-hidden="true" /> Arenas</Link>
    <div className="arena-detail-photo"><Image src={arena.image} alt={`Ilustração de ${arena.name} em São Paulo.`} width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" preload /><span className="arena-label-badge">Arena de demonstração</span></div>
    <header className="arena-detail-header"><p className="location-line"><MapPin size={14} aria-hidden="true" />{arena.neighborhood} · São Paulo</p><h1>{arena.name}</h1><div className="arena-sports">{arena.sports.map(s => <SportLabel sport={s} key={s} />)}</div><p className="community-count">{people.length} pessoas acompanham esta arena · demo</p></header>
    <div className="arena-join-actions"><button type="button" className={buttonVariants({ variant: following ? "secondary" : "primary" })} aria-pressed={following} onClick={() => dispatch({ type: "follow", arenaId: arena.id })}>{following ? <Check size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{following ? "Deixar de acompanhar" : "Acompanhar arena"}</button><Link href={`/jogos?arena=${arena.slug}`}>Joguei aqui</Link></div>
    <section className="arena-about"><h2>Comunidades deste lugar</h2><DemoCommunities arenaId={arena.id} /></section>
    <div className="feed-tabs detail-tabs" role="group" aria-label="Conteúdo da arena">{([{ id: "posts", label: "Publicações" }, { id: "people", label: `Pessoas (${people.length})` }, { id: "about", label: "Sobre" }] as const).map(t => <button type="button" key={t.id} className={tab === t.id ? "active-tab" : ""} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {tab === "posts" && <div className="detail-content"><PostComposer fixedArenaId={arena.id} /><div className="post-list">{posts.map(p => <PostCard post={p} key={p.id} />)}{!posts.length && <EmptyState title="A comunidade começa com você.">Compartilhe o primeiro encontro nessa arena.</EmptyState>}</div></div>}
    {tab === "people" && <div className="people-list">{people.map(p => <PlayerCard key={p.id} player={p} />)}{!people.length && <EmptyState title="Conheça quem acompanha este Pico.">Ainda não há participantes para mostrar. Explore outras arenas e pessoas.</EmptyState>}</div>}
    {tab === "about" && <section className="arena-about"><h2>Um pouco do nosso Pico</h2><p>{arena.description}</p><h3>Por aqui tem</h3><ul>{arena.amenities.map(a => <li key={a}><Droplets size={16} aria-hidden="true" />{a}</li>)}</ul><p className="form-note">Arena e imagem fictícias, criadas para explorar o Pico.</p></section>}
  </>;
}

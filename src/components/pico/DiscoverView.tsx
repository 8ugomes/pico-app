"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useDemo } from "./DemoProvider";
import { PageHeading, SearchField, SportFilter, EmptyState } from "./SocialUI";
import { PlayerCard } from "./PlayerCard";
import { normalizeSearch } from "@/lib/demo-state";
import type { SportId } from "@/types/social";

export function DiscoverView() {
  const { state, me } = useDemo();
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportId | "all">("all");
  const players = state.players.filter(p => p.id !== me.id && (query.trim().startsWith("@") ? normalizeSearch(p.username).includes(normalizeSearch(query.trim().slice(1))) && query.trim().length > 1 : normalizeSearch(p.name + " " + p.username).includes(normalizeSearch(query.trim()))) && (sport === "all" || p.sports.some(s => s.sportId === sport)));
  return <>
    <PageHeading title="Pessoas"><Link className="journey-text-link" href="/comunidades">Buscar comunidades</Link></PageHeading>
    <SearchField tourId="people-search" value={query} onChange={setQuery} placeholder="Nome ou @usuário" label="Buscar pessoas por nome ou usuário" maxLength={100} />
    {query && <Button variant="quiet" size="small" onClick={() => setQuery('')}>Limpar busca</Button>}
    <SportFilter value={sport} onChange={setSport} />
    <div className="list-heading"><span>{players.length} {players.length === 1 ? "pessoa" : "pessoas"} pra conhecer</span></div>
    <div className="people-list">{players.map(p => <PlayerCard player={p} key={p.id} />)}</div>
    {!players.length && <EmptyState title="Sua turma pode estar logo ali.">Tente outro nome, @usuário ou esporte para descobrir mais pessoas.</EmptyState>}
  </>;
}

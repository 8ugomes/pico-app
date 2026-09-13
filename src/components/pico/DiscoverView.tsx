"use client";
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
  const players = state.players.filter(p => p.id !== me.id && normalizeSearch(p.name + " " + p.neighborhood).includes(normalizeSearch(query)) && (sport === "all" || p.sports.some(s => s.sportId === sport)));
  return <>
    <PageHeading eyebrow="UM ESPORTE EM COMUM" title="Pessoas" />
    <SearchField tourId="people-search" value={query} onChange={setQuery} placeholder="Nome ou bairro" label="Buscar pessoas por nome ou bairro" />
    <SportFilter value={sport} onChange={setSport} />
    <div className="list-heading"><span>{players.length} {players.length === 1 ? "pessoa" : "pessoas"} pra conhecer</span></div>
    <div className="people-list">{players.map(p => <PlayerCard player={p} key={p.id} />)}</div>
    {!players.length && <EmptyState title="Sua turma pode estar logo ali.">Tente outro nome, bairro ou esporte para descobrir mais pessoas.</EmptyState>}
  </>;
}

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
  const [available, setAvailable] = useState(false);
  const players = state.players.filter(p => p.id !== me.id && normalizeSearch(p.name + " " + p.neighborhood).includes(normalizeSearch(query)) && (sport === "all" || p.sports.some(s => s.sportId === sport)) && (!available || p.available));
  return <>
    <PageHeading eyebrow="GENTE QUE JOGA COM VOCÊ" title="Encontre sua turma." />
    <SearchField value={query} onChange={setQuery} placeholder="Nome ou bairro" label="Buscar pessoas por nome ou bairro" />
    <SportFilter value={sport} onChange={setSport} />
    <div className="list-heading"><span>{players.length} {players.length === 1 ? "pessoa" : "pessoas"} pra conhecer</span><button type="button" className={available ? "availability-filter filter-on" : "availability-filter"} aria-pressed={available} onClick={() => setAvailable(!available)}><span />Bora jogar</button></div>
    <div className="people-list">{players.map(p => <PlayerCard player={p} key={p.id} />)}</div>
    {!players.length && <EmptyState title="Sua turma pode estar logo ali.">Tente outro nome, bairro ou esporte para descobrir mais pessoas.</EmptyState>}
  </>;
}

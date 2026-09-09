"use client";
import { useState } from "react";
import { useDemo } from "./DemoProvider";
import { PageHeading, SearchField, SportFilter, EmptyState } from "./SocialUI";
import { ArenaCard } from "./ArenaCard";
import { normalizeSearch } from "@/lib/demo-state";
import type { SportId } from "@/types/social";

export function ArenasView() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportId | "all">("all");
  const [following, setFollowing] = useState(false);
  const arenas = state.arenas.filter(a => normalizeSearch(a.name + " " + a.neighborhood).includes(normalizeSearch(query)) && (sport === "all" || a.sports.includes(sport)) && (!following || state.followedArenaIds.includes(a.id)));
  return <>
    <PageHeading eyebrow="SÃO PAULO, SP" title="Encontre seu lugar." />
    <SearchField value={query} onChange={setQuery} placeholder="Arena ou bairro" label="Buscar arenas por nome ou bairro" />
    <SportFilter value={sport} onChange={setSport} />
    <div className="list-heading"><span>{arenas.length} {arenas.length === 1 ? "comunidade" : "comunidades"} na sua cidade</span><button type="button" aria-pressed={following} className={following ? "text-filter filter-on" : "text-filter"} onClick={() => setFollowing(!following)}>Só as que sigo</button></div>
    <div className="arena-list">{arenas.map(a => <ArenaCard key={a.id} arena={a} />)}</div>
    {!arenas.length && <EmptyState title="Ainda não achamos esse Pico.">Tente outro bairro ou esporte, ou desative o filtro de arenas que você segue.</EmptyState>}
  </>;
}

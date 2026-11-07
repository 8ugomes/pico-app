"use client";
import { useState } from "react";
import Link from "next/link";
import type { Arena } from "@/types/social";
import { demoRanking, type DemoRankingPeriod } from "@/lib/demo-state";
import { dayBack, rankingPeriods } from "@/lib/arena-checkin";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { CheckinAction, CheckinDays, PeriodTabs, RankingEmpty, RankingList, type RankingRowView } from "./ArenaRankingParts";

export function DemoArenaRanking({ arena }: { arena: Arena }) {
  const { state, dispatch } = useDemo();
  const [period, setPeriod] = useState<DemoRankingPeriod>("week");
  const [today] = useState(() => dayBack(0));
  const scope = rankingPeriods.find(p => p.id === period)!.scope;
  const rows: RankingRowView[] = demoRanking(state, arena.id, period, today).map(r => {
    const player = state.players.find(p => p.id === r.id);
    return { key: r.id, rank: r.rank, name: r.name, days: r.days, me: r.me, href: r.me ? undefined : `/perfil/${r.id}`, avatar: player ? <PlayerAvatar player={player} size="small" /> : <span /> };
  });
  const mine = state.arenaCheckins.filter(c => c.arenaId === arena.id).map(c => c.day);
  const me = rows.find(r => r.me);
  return <section className="arena-ranking" aria-labelledby="arena-ranking-title">
    <h2 id="arena-ranking-title">Quem mais joga aqui</h2>
    <p className="form-note">Demonstração: os números das outras pessoas são ilustrativos. Seus check-ins ficam só nesta sessão.</p>
    <PeriodTabs value={period} onChange={setPeriod} />
    <p className="ranking-summary" role="status">{me ? `Você está em ${me.rank}º lugar ${scope}, com ${me.days === 1 ? "1 dia" : `${me.days} dias`}.` : `Você ainda não pontuou ${scope}.`}</p>
    {rows.length ? <RankingList rows={rows} /> : <RankingEmpty scope={scope} />}
    <CheckinAction doneToday={mine.includes(today)} busy={false} onToggleToday={() => dispatch({ type: "arena_checkin", arenaId: arena.id, day: today })}>
      <details className="checkin-other"><summary>Registrar outro dia</summary><p className="form-note">Vale hoje e os seis dias anteriores. Toque de novo para remover.</p><CheckinDays checked={mine} busy={false} onToggle={day => dispatch({ type: "arena_checkin", arenaId: arena.id, day })} /></details>
    </CheckinAction>
  </section>;
}

export function DemoArenasActivity() {
  const { state } = useDemo();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [today] = useState(() => dayBack(0));
  const top = state.arenas.map(a => { const rows = demoRanking(state, a.id, period, today); return { arena: a, players: rows.length, days: rows.reduce((n, r) => n + r.days, 0) }; })
    .filter(r => r.players > 0).sort((a, b) => b.players - a.players || b.days - a.days || a.arena.name.localeCompare(b.arena.name, "pt-BR")).slice(0, 5);
  return <section className="arena-activity" aria-labelledby="arena-activity-title">
    <div className="arena-activity-head"><h2 id="arena-activity-title">Em movimento</h2>
      <div className="feed-tabs ranking-tabs" role="group" aria-label="Período das arenas em movimento">{(["week", "month"] as const).map(p => <button type="button" key={p} className={period === p ? "active-tab" : ""} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p === "week" ? "Semana" : "Mês"}</button>)}</div></div>
    <p className="form-note">Demonstração: contagens ilustrativas.</p>
    {top.length ? <ol className="ranking-list arena-activity-list">{top.map((r, i) => <li key={r.arena.id} className="ranking-row"><Link href={`/arenas/${r.arena.slug}`}><span className="rank-place" aria-label={`${i + 1}º lugar`}>{i + 1}</span><span className="rank-name"><strong>{r.arena.name}</strong><small>{r.arena.neighborhood} · São Paulo</small></span><span className="rank-days">{r.players === 1 ? "1 pessoa" : `${r.players} pessoas`}</span></Link></li>)}</ol> : <RankingEmpty scope={period === "week" ? "nesta semana" : "neste mês"} />}
  </section>;
}

"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { LoaderCircle, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dayWord, rankingPeriods, windowDays, type RankingPeriod } from "@/lib/arena-checkin";

export type RankingRowView = { key: string; rank: number; name: string; days: number; me?: boolean; href?: string; avatar: ReactNode };

export function PeriodTabs({ value, onChange, label = "Período do ranking" }: { value: RankingPeriod; onChange: (value: RankingPeriod) => void; label?: string }) {
  return <div className="feed-tabs ranking-tabs" role="group" aria-label={label}>{rankingPeriods.map(p => <button type="button" key={p.id} className={value === p.id ? "active-tab" : ""} aria-pressed={value === p.id} onClick={() => onChange(p.id)}>{p.label}</button>)}</div>;
}

export function RankingSkeleton() {
  return <div className="ranking-loading" role="status" aria-busy="true" aria-label="Carregando ranking"><span className="sr-only">Carregando ranking…</span>{[0, 1, 2].map(i => <div key={i} className="read-skeleton ranking-skeleton-row" aria-hidden="true" />)}</div>;
}

export function RankingList({ rows }: { rows: RankingRowView[] }) {
  return <ol className="ranking-list">{rows.map(row => {
    const body = <><span className="rank-place" aria-label={`${row.rank}º lugar`}>{row.rank}</span>{row.avatar}<span className="rank-name"><strong>{row.name}</strong>{row.me && <small>Você</small>}</span><span className="rank-days">{dayWord(row.days)}</span></>;
    return <li key={row.key} className={row.me ? "ranking-row ranking-row-me" : "ranking-row"}>{row.href ? <Link href={row.href}>{body}</Link> : <div>{body}</div>}</li>;
  })}</ol>;
}

export function RankingEmpty({ scope }: { scope: string }) {
  return <div className="ranking-empty"><Trophy size={26} aria-hidden="true" /><h3>Ninguém por aqui {scope}.</h3><p>O primeiro check-in coloca você na frente.</p></div>;
}

export function RankingError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="ranking-empty" role="alert"><h3>Não deu para carregar o ranking.</h3><p>{message}</p><Button size="small" variant="secondary" onClick={retry}><RefreshCw size={15} aria-hidden="true" /> Tentar novamente</Button></div>;
}

/** Seven day chips: today plus the six allowed days back. Tapping a chip records or removes that day. */
export function CheckinDays({ checked, busy, onToggle, disabled }: { checked: string[]; busy: boolean; onToggle: (day: string, back: number, done: boolean) => void; disabled?: boolean }) {
  return <div className="checkin-days" role="group" aria-label="Dias com check-in">{windowDays().map(d => {
    const done = checked.includes(d.day);
    return <button type="button" key={d.day} className={done ? "filter-chip selected" : "filter-chip"} aria-pressed={done} disabled={busy || disabled} onClick={() => onToggle(d.day, d.back, done)}>{d.label}</button>;
  })}</div>;
}

export function CheckinAction({ doneToday, busy, disabled, onToggleToday, children }: { doneToday: boolean; busy: boolean; disabled?: boolean; onToggleToday: () => void; children?: ReactNode }) {
  return <div className="checkin-box">
    <Button variant={doneToday ? "secondary" : "primary"} aria-pressed={doneToday} aria-busy={busy} disabled={busy || disabled} onClick={onToggleToday}>{busy ? <><LoaderCircle size={16} className="spinner" aria-hidden="true" /> Salvando…</> : doneToday ? "Desfazer check-in de hoje" : "Fiz check-in hoje"}</Button>
    {children}
  </div>;
}

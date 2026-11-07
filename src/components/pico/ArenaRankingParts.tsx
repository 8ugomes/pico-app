"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { LoaderCircle, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { levelFor, pointKindLabels, pointRules, pointsWord, rankingPeriods, windowDays, type PointKind, type RankingPeriod } from "@/lib/arena-checkin";

export type RankingRowView = { key: string; rank: number; name: string; points: number; me?: boolean; href?: string; avatar: ReactNode };

export function PeriodTabs({ value, onChange, label = "Período do ranking" }: { value: RankingPeriod; onChange: (value: RankingPeriod) => void; label?: string }) {
  return <div className="feed-tabs ranking-tabs" role="group" aria-label={label}>{rankingPeriods.map(p => <button type="button" key={p.id} className={value === p.id ? "active-tab" : ""} aria-pressed={value === p.id} onClick={() => onChange(p.id)}>{p.label}</button>)}</div>;
}

export function RankingSkeleton() {
  return <div className="ranking-loading" role="status" aria-busy="true" aria-label="Carregando ranking"><span className="sr-only">Carregando ranking…</span>{[0, 1, 2].map(i => <div key={i} className="read-skeleton ranking-skeleton-row" aria-hidden="true" />)}</div>;
}

export function RankingList({ rows }: { rows: RankingRowView[] }) {
  return <ol className="ranking-list">{rows.map(row => {
    const body = <><span className="rank-place" aria-label={`${row.rank}º lugar`}>{row.rank}</span>{row.avatar}<span className="rank-name"><strong>{row.name}</strong>{row.me && <small>Você</small>}</span><span className="rank-days">{pointsWord(row.points)}</span></>;
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

export function LevelCard({ points }: { points: number }) {
  const { current, next, progress, remaining } = levelFor(points);
  return <div className="level-card"><div className="level-head"><strong>{current.name}</strong><span>{pointsWord(points)} na arena</span></div>
    <div className="level-track" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
    <p>{next ? `Faltam ${pointsWord(remaining)} para ${next.name}.` : "Você chegou ao nível mais alto desta arena."}</p></div>;
}

export function PointBreakdown({ breakdown }: { breakdown: Partial<Record<PointKind, { points: number; count: number }>> }) {
  const items = (Object.keys(pointKindLabels) as PointKind[]).filter(k => breakdown[k]);
  if (!items.length) return null;
  return <ul className="point-breakdown" aria-label="De onde vêm seus pontos">{items.map(k => <li key={k}><span>{pointKindLabels[k]}</span><strong>{breakdown[k]!.points}</strong></li>)}</ul>;
}

export function PointRules() {
  return <details className="point-rules"><summary>Como pontuar</summary>
    <ul>{pointRules.map(r => <li key={r.kind}><span>{r.label}</span><strong>{r.points}</strong><small>{r.cap}</small></li>)}</ul>
    <p className="form-note">Os tetos por dia evitam que o ranking vire corrida de volume. Apagar uma publicação, comentário ou curtida tira os pontos dela.</p></details>;
}

"use client";
import { CircleDot, Footprints, Volleyball, Search, Compass } from "lucide-react";
import type { SportId } from "@/types/social";
import { useDemo } from "./DemoProvider";

export function SportIcon({ sport, size = 16 }: { sport: SportId; size?: number }) {
  const Icon = sport === "futevolei" ? Footprints : sport === "beach-tennis" ? CircleDot : Volleyball;
  return <Icon size={size} aria-hidden="true" />;
}
export function SportLabel({ sport }: { sport: SportId }) {
  const { state } = useDemo();
  return <span className="sport-label"><SportIcon sport={sport} />{state.sports.find(s => s.id === sport)?.name}</span>;
}
export function SportFilter({ value, onChange }: { value: SportId | "all"; onChange: (value: SportId | "all") => void }) {
  const { state } = useDemo();
  return <div className="sport-filters" aria-label="Filtrar por esporte">
    <button type="button" className={value === "all" ? "filter-chip selected" : "filter-chip"} aria-pressed={value === "all"} onClick={() => onChange("all")}>Todos</button>
    {state.sports.map(s => <button key={s.id} type="button" className={value === s.id ? "filter-chip selected" : "filter-chip"} aria-pressed={value === s.id} onClick={() => onChange(s.id)}><SportIcon sport={s.id} />{s.shortName}</button>)}
  </div>;
}
export function SearchField({ value, onChange, placeholder, label, tourId }: { tourId?: string; value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return <label data-tour={tourId} className="search-field"><Search size={19} aria-hidden="true" /><span className="sr-only">{label}</span><input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>;
}
export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="social-empty"><Compass size={28} aria-hidden="true" /><h3>{title}</h3><p>{children}</p></div>;
}
export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <header className="page-heading"><div><p>{eyebrow}</p><h1>{title}</h1></div>{children}</header>;
}

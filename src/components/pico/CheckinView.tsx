"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Check, Clock3, ArrowUpRight } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { PageHeading, SportIcon } from "./SocialUI";
import { PlayerAvatar } from "./PlayerAvatar";
import { Button, buttonVariants } from "@/components/ui/Button";
import type { SportId } from "@/types/social";

export function CheckinView({ initialArenaId }: { initialArenaId?: string }) {
  const { state, dispatch, now, me, present } = useDemo();
  const initial = state.arenas.find(a => a.id === initialArenaId);
  const [arenaId, setArenaId] = useState(initial?.id ?? "");
  const [sportId, setSportId] = useState<SportId | "">(initial?.sports[0] ?? "");
  const [notice, setNotice] = useState("");
  const selected = state.arenas.find(a => a.id === arenaId);
  const current = present.find(c => c.playerId === me.id);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected || !sportId || !selected.sports.includes(sportId)) return;
    dispatch({ type: "checkin", arenaId, sportId, now, id: crypto.randomUUID() });
    setNotice("Check-in feito na demonstração.");
  }
  if (current) {
    const arena = state.arenas.find(a => a.id === current.arenaId)!;
    const minutes = Math.max(0, Math.ceil((current.expiresAt - now) / 60000));
    const others = present.filter(c => c.arenaId === arena.id && c.playerId !== me.id).map(c => state.players.find(p => p.id === c.playerId)!);
    return <>
      <PageHeading eyebrow="ME ACHA NO PICO" title="Você tá na areia." />
      <section className="active-checkin">
        <div className="active-checkin-photo"><Image src={arena.image} alt="Ilustração da arena do seu check-in." width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" /><span><Check size={28} aria-hidden="true" /></span></div>
        <div className="active-checkin-content"><span className="availability available"><span />Estou no Pico</span><h2>{arena.name}</h2><p>{state.sports.find(s => s.id === current.sportId)?.name} · {arena.neighborhood}</p><div className="checkin-expiry"><Clock3 size={16} aria-hidden="true" />Faltam {minutes} min para o check-in terminar.</div>
          <div className="checkin-company"><div className="mini-avatar-stack">{others.map(p => <PlayerAvatar player={p} key={p.id} size="small" />)}</div><span>{others.length ? `Mais ${others.length} ${others.length === 1 ? "pessoa por" : "pessoas por"} aqui.` : "Você abriu a roda por aqui."}</span></div>
          <Link className={buttonVariants()} href={`/arenas/${arena.slug}`}>Ver a comunidade <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Button variant="quiet" onClick={() => { dispatch({ type: "checkout" }); setNotice("Check-in encerrado. Até o próximo jogo!"); }}>Encerrar check-in</Button>
        </div>
      </section>
      {notice && <p className="inline-success" role="status">{notice}</p>}
    </>;
  }
  return <>
    <PageHeading eyebrow="BORA PRA AREIA" title="Onde é seu Pico?" />
    <p className="page-intro">Chegou? Mostre pra turma onde o jogo tá rolando.</p>
    {(notice || state.checkins.some(c => c.playerId === me.id && c.expiresAt <= now)) && <p className="inline-success" role="status">{state.checkins.some(c => c.playerId === me.id && c.expiresAt <= now) ? "Seu check-in terminou. Bora pro próximo?" : notice}</p>}
    <form className="checkin-form" onSubmit={submit}>
      <fieldset><legend><span>1</span> Escolha sua arena</legend><div className="checkin-arena-options">{state.arenas.map(a => <label className={arenaId === a.id ? "checkin-arena-option chosen" : "checkin-arena-option"} key={a.id}><input type="radio" name="arena" value={a.id} checked={arenaId === a.id} onChange={() => { setArenaId(a.id); setSportId(a.sports[0]); }} required /><Image src={a.image} alt="" width={70} height={70} sizes="70px" style={{ objectPosition: a.imagePosition }} /><span><strong>{a.name}</strong><small>{a.neighborhood}</small></span><span className="radio-indicator">{arenaId === a.id && <Check size={13} aria-hidden="true" />}</span></label>)}</div></fieldset>
      <fieldset disabled={!selected}><legend><span>2</span> Qual é o jogo?</legend><div className="checkin-sport-options">{(selected?.sports ?? state.sports.map(s => s.id)).map(id => <label className={sportId === id ? "checkin-sport chosen" : "checkin-sport"} key={id}><input type="radio" name="sport" value={id} checked={sportId === id} onChange={() => setSportId(id)} required /><SportIcon sport={id} size={22} /><span>{state.sports.find(s => s.id === id)?.name}</span></label>)}</div></fieldset>
      <div className="checkin-privacy"><Clock3 size={18} aria-hidden="true" /><p>Seu check-in dura 2 horas.<br /><span>Você pode encerrar quando quiser.</span></p></div>
      <Button type="submit" size="large" className="full-button" disabled={!selected || !sportId}><MapPin size={19} aria-hidden="true" />Estou no Pico</Button>
      <p className="form-note centered">Sem localização automática. Você escolhe onde aparecer.</p>
    </form>
  </>;
}

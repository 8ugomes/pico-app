"use client";
import Link from "next/link";
import { Check, Plus, MapPin } from "lucide-react";
import type { Player } from "@/types/social";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { SportIcon } from "./SocialUI";

export function PlayerCard({ player }: { player: Player }) {
  const { state, dispatch, me } = useDemo();
  const connected = state.connectedPlayerIds.includes(player.id);
  const main = player.sports[0];
  return <article className="player-card">
    <Link className="player-card-link" href={player.id === me.id ? "/perfil" : `/perfil/${player.username}`}><PlayerAvatar player={player} size="large" /><div><h2>{player.name}</h2><p className="location-line"><MapPin size={12} aria-hidden="true" /> {player.neighborhood}</p><p className="player-main-sport"><SportIcon sport={main.sportId} size={14} />{state.sports.find(s => s.id === main.sportId)?.shortName} <span>· {main.level}</span></p></div></Link>
    <div className="player-card-bottom">{player.id !== me.id && <button type="button" className={connected ? "connect-button connected" : "connect-button"} aria-pressed={connected} aria-label={connected ? `Deixar de acompanhar ${player.name}` : `Acompanhar ${player.name}`} onClick={() => dispatch({ type: "connect", playerId: player.id })}>{connected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{connected ? "Acompanhando" : "Acompanhar"}</button>}</div>
  </article>;
}

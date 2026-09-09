"use client";
import Link from "next/link";
import { Check, Plus, MapPin } from "lucide-react";
import type { Player } from "@/types/social";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { SportIcon } from "./SocialUI";

export function PlayerCard({ player }: { player: Player }) {
  const { state, dispatch, present, me } = useDemo();
  const connected = state.connectedPlayerIds.includes(player.id);
  const playing = present.some(c => c.playerId === player.id);
  const main = player.sports[0];
  return <article className="player-card">
    <Link className="player-card-link" href={player.id === me.id ? "/perfil" : `/perfil/${player.username}`}><PlayerAvatar player={player} size="large" active={playing} /><div><h2>{player.name}</h2><p className="location-line"><MapPin size={12} aria-hidden="true" /> {player.neighborhood}</p><p className="player-main-sport"><SportIcon sport={main.sportId} size={14} />{state.sports.find(s => s.id === main.sportId)?.shortName} <span>· {main.level}</span></p></div></Link>
    <div className="player-card-bottom"><span className={player.available ? "availability available" : "availability"}><span />{playing ? "Na areia agora" : player.available ? "Bora jogar" : "A gente se encontra"}</span>{player.id !== me.id && <button type="button" className={connected ? "connect-button connected" : "connect-button"} aria-pressed={connected} aria-label={connected ? `Desconectar de ${player.name}` : `Conectar com ${player.name}`} onClick={() => dispatch({ type: "connect", playerId: player.id })}>{connected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{connected ? "Na sua turma" : "Conectar"}</button>}</div>
  </article>;
}

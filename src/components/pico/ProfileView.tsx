"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, MapPin, Check, Plus, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { PostCard } from "./PostCard";
import { ArenaCard } from "./ArenaCard";
import { SportIcon, EmptyState } from "./SocialUI";
import { PostComposer } from "./PostComposer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ProfileView({ playerId }: { playerId?: string }) {
  const { state, dispatch, me, present } = useDemo();
  const player = state.players.find(p => p.id === (playerId ?? me.id))!;
  const mine = player.id === me.id;
  const [tab, setTab] = useState<"posts" | "arenas">("posts");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [bio, setBio] = useState(player.bio);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const checkin = present.find(c => c.playerId === player.id);
  const arena = state.arenas.find(a => a.id === checkin?.arenaId);
  const connected = state.connectedPlayerIds.includes(player.id);
  const posts = state.posts.filter(p => p.authorId === player.id);
  const arenas = state.arenas.filter(a => (mine ? state.followedArenaIds : player.arenaIds).includes(a.id));
  function save(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 60 || bio.trim().length > 160) { setError("Use um nome de 2 a 60 caracteres e uma bio de até 160."); return; }
    dispatch({ type: "profile", input: { name, bio, available: player.available } });
    setEditing(false); setError(""); setNotice("Perfil atualizado nesta demonstração.");
  }
  return <>
    {!mine && <Link className="detail-back" href="/descobrir"><ArrowLeft size={17} aria-hidden="true" /> Descobrir pessoas</Link>}
    <div className="profile-cover"><Image src="/images/urban-court.webp" alt="Ilustração de uma quadra de areia em São Paulo." width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" /><span>ME ACHA NO PICO.</span></div>
    <div className="profile-top"><PlayerAvatar player={player} size="profile" active={Boolean(checkin)} />{mine ? <Button size="small" variant="secondary" onClick={() => { setName(player.name); setBio(player.bio); setNotice(""); setEditing(true); }}><Pencil size={15} aria-hidden="true" />Editar perfil</Button> : <Button size="small" variant={connected ? "secondary" : "primary"} aria-pressed={connected} onClick={() => dispatch({ type: "connect", playerId: player.id })}>{connected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{connected ? "Na sua turma" : "Conectar"}</Button>}</div>
    <header className="profile-heading"><h1>{player.name}</h1><p>@{player.username} <span>· {player.neighborhood}, SP</span></p></header>
    <p className="profile-bio">{player.bio}</p>
    <div className="profile-sports">{player.sports.map(s => <div key={s.sportId}><SportIcon sport={s.sportId} size={19} /><span><strong>{state.sports.find(sport => sport.id === s.sportId)?.name}</strong><small>{s.level}</small></span></div>)}</div>
    {mine ? <label className="availability-switch"><span><strong>Bora jogar</strong><small>Apareça entre quem tá disponível.</small></span><input type="checkbox" checked={me.available} onChange={e => dispatch({ type: "profile", input: { name: me.name, bio: me.bio, available: e.target.checked } })} /><span className="switch-track" aria-hidden="true" /></label> : <p className={player.available ? "availability available profile-availability" : "availability profile-availability"}><span />{player.available ? "Disponível pra jogar" : "Hoje só na torcida"}</p>}
    {arena && <Link className="profile-checkin" href={`/arenas/${arena.slug}`}><MapPin size={18} aria-hidden="true" /><span>Na areia agora<strong>{arena.name}</strong></span><ArrowUpRight size={18} aria-hidden="true" /></Link>}
    {notice && <p className="inline-success" role="status">{notice}</p>}
    <div className="feed-tabs detail-tabs" role="group" aria-label="Conteúdo do perfil"><button type="button" className={tab === "posts" ? "active-tab" : ""} aria-pressed={tab === "posts"} onClick={() => setTab("posts")}>{mine ? "Meus posts" : "Posts"}</button><button type="button" className={tab === "arenas" ? "active-tab" : ""} aria-pressed={tab === "arenas"} onClick={() => setTab("arenas")}>{mine ? "Minhas arenas" : "Onde joga"} <span>({arenas.length})</span></button></div>
    {tab === "posts" && <div className="detail-content">{mine && <PostComposer />}<div className="post-list">{posts.map(p => <PostCard post={p} key={p.id} />)}{!posts.length && <EmptyState title={mine ? "Seu primeiro post te espera." : "A resenha ainda vai começar."}>{mine ? "Compartilhe um jogo ou chame sua próxima dupla no campo acima." : "Enquanto isso, conheça as arenas dessa pessoa."}</EmptyState>}</div></div>}
    {tab === "arenas" && <div className="arena-list profile-arenas">{arenas.map(a => <ArenaCard key={a.id} arena={a} />)}{!arenas.length && <EmptyState title="Encontre seu lugar na areia.">Explore as arenas e siga suas comunidades favoritas.</EmptyState>}</div>}
    {mine && <Link className="demo-account-link" href="/login">Acessar minha conta real <ArrowUpRight size={15} aria-hidden="true" /></Link>}
    <Modal open={editing} onClose={() => setEditing(false)} title="Seu perfil no Pico"><form className="social-form" onSubmit={save}><label>Seu nome<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={60} required autoComplete="nickname" /></label><label>Sua bio<textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} rows={3} /></label><span className="form-count">{bio.length}/160</span>{error && <p className="form-error" role="alert">{error}</p>}<p className="form-note">Edição do jogador fictício. Vale só nesta sessão.</p><Button type="submit">Salvar perfil <Check size={17} aria-hidden="true" /></Button></form></Modal>
  </>;
}

"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Pencil, Check, Plus, ArrowLeft, ArrowUpRight } from "lucide-react";
import { demoFeed } from "@/lib/demo-state";
import { TourLauncher } from "./GuidedOnboarding";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { PostCard } from "./PostCard";
import { SportIcon, EmptyState } from "./SocialUI";
import { PostComposer } from "./PostComposer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ProfileView({ playerId }: { playerId?: string }) {
  const { state, dispatch, me } = useDemo();
  const player = state.players.find(p => p.id === (playerId ?? me.id))!;
  const mine = player.id === me.id;
  const [tab, setTab] = useState<"posts" | "arenas">("posts");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [bio, setBio] = useState(player.bio);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const connected = state.connectedPlayerIds.includes(player.id);
  const posts = demoFeed(state, player.id);
  const arenas = state.arenas.filter(a => (mine ? state.followedArenaIds : player.arenaIds).includes(a.id));
  function save(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 60 || bio.trim().length > 160) { setError("Use um nome de 2 a 60 caracteres e uma bio de até 160."); return; }
    dispatch({ type: "profile", input: { name, bio, available: player.available } });
    setEditing(false); setError(""); setNotice("Perfil atualizado nesta demonstração.");
  }
  return <>
    {!mine && <Link className="detail-back" href="/descobrir"><ArrowLeft size={17} aria-hidden="true" /> Descobrir pessoas</Link>}
    <div className="demo-profile-top"><PlayerAvatar player={player} size="profile" />{mine ? <Button data-tour="edit-profile" size="small" variant="secondary" onClick={() => { setName(player.name); setBio(player.bio); setNotice(""); setEditing(true); }}><Pencil size={15} aria-hidden="true" />Editar perfil</Button> : <Button size="small" variant={connected ? "secondary" : "primary"} aria-pressed={connected} onClick={() => dispatch({ type: "connect", playerId: player.id })}>{connected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{connected ? "Acompanhando" : "Acompanhar"}</Button>}</div>
    <header className="profile-heading"><h1>{player.name}</h1><p>@{player.username} <span>· {player.neighborhood}, SP</span></p></header>
    <p className="profile-bio">{player.bio}</p>
    <div className="profile-sports">{player.sports.map(s => <div key={s.sportId}><SportIcon sport={s.sportId} size={19} /><span><strong>{state.sports.find(sport => sport.id === s.sportId)?.name}</strong><small>{s.level}</small></span></div>)}</div>
    {mine && <Link className="journal-link" href="/jogos">Meus jogos <ArrowUpRight size={18} aria-hidden="true" /></Link>}
    {notice && <p className="inline-success" role="status">{notice}</p>}
    <div className="feed-tabs detail-tabs" role="group" aria-label="Conteúdo do perfil"><button type="button" className={tab === "posts" ? "active-tab" : ""} aria-pressed={tab === "posts"} onClick={() => setTab("posts")}>Publicações</button><button type="button" className={tab === "arenas" ? "active-tab" : ""} aria-pressed={tab === "arenas"} onClick={() => setTab("arenas")}>{mine ? "Meus Picos" : "Vínculos"} <span>({arenas.length})</span></button></div>
    {tab === "posts" && <div className="detail-content">{mine && <PostComposer />}<div className="post-list">{posts.map(({ post, repost }) => <PostCard post={post} repost={repost} key={post.id} />)}{!posts.length && <EmptyState title={mine ? "Seu primeiro post te espera." : "A resenha ainda vai começar."}>{mine ? "Compartilhe um jogo ou chame sua próxima dupla no campo acima." : "Enquanto isso, conheça as arenas dessa pessoa."}</EmptyState>}</div></div>}
    {tab === "arenas" && <div className="profile-places"><h2>Arenas acompanhadas</h2><div className="context-links">{arenas.map(a => <Link href={`/arenas/${a.slug}`} key={a.id}>{a.name}</Link>)}</div><h2>Comunidades</h2><div className="context-links">{state.communities.filter(c => c.members.includes(player.id) && (c.visibility === "beta" || c.members.includes(me.id))).map(c => <Link href={`/comunidades/${c.slug}`} key={c.id}>{c.name}</Link>)}</div>{!arenas.length && <EmptyState title="Encontre seu lugar na areia.">Explore as arenas e siga suas comunidades favoritas.</EmptyState>}</div>}
    {mine && <TourLauncher />}
    {mine && <Link className="demo-account-link" href="/login">Acessar minha conta real <ArrowUpRight size={15} aria-hidden="true" /></Link>}
    <Modal open={editing} onClose={() => setEditing(false)} title="Seu perfil no Pico"><form className="social-form" onSubmit={save}><label>Seu nome<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={60} required autoComplete="nickname" /></label><label>Sua bio<textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} rows={3} /></label><span className="form-count">{bio.length}/160</span>{error && <p className="form-error" role="alert">{error}</p>}<p className="form-note">Edição do jogador fictício. Vale só nesta sessão.</p><Button type="submit">Salvar perfil <Check size={17} aria-hidden="true" /></Button></form></Modal>
  </>;
}

"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Send, ArrowUpRight } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { SportLabel } from "./SocialUI";
import { formatGameDate } from '@/lib/game-date';
import { timeAgo } from "@/lib/demo-state";
import { RepostAttribution, RepostControl } from "./RepostControl";
import type { Post, DemoRepost } from "@/types/social";

export function PostCard({ post, repost }: { post: Post; repost?: DemoRepost }) {
  const { state, dispatch, now, me } = useDemo();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const author = state.players.find(p => p.id === post.authorId)!;
  const arena = state.arenas.find(a => a.id === post.arenaId)!;
  const republisher = state.players.find(p => p.id === repost?.playerId);
  const reposted = state.reposts.some(r => r.postId === post.id && r.playerId === me.id);
  const liked = state.likedPostIds.includes(post.id);
  const comments = state.comments.filter(c => c.postId === post.id);
  function send(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim() || comment.trim().length > 280) return;
    dispatch({ type: "comment", postId: post.id, content: comment, id: crypto.randomUUID(), now });
    setComment("");
  }
  return <article className="post-card">
    {repost && republisher && <RepostAttribution name={republisher.id === me.id ? "Você" : republisher.name} href={republisher.id === me.id ? "/perfil" : `/perfil/${republisher.username}`} createdAt={new Date(repost.createdAt).toISOString()} />}
    <header className="post-header">
      <Link href={author.id === me.id ? "/perfil" : `/perfil/${author.username}`} className="post-person"><PlayerAvatar player={author} /><span><strong>{author.name}</strong><small>Publicado {timeAgo(post.createdAt, now)} · Demo</small></span></Link>
      <SportLabel sport={post.sportId} />
    </header>
    <p className="form-note">{post.audience === 'private' ? 'Grupo privado · simulação' : 'Pessoas do Pico · simulação'} · <Link href={`/publicacoes/${post.id}`}>Abrir publicação</Link></p>
    {post.gamePlayedOn && <p className="post-game-date">Jogado em <time dateTime={post.gamePlayedOn}>{formatGameDate(post.gamePlayedOn)}</time> · relato de quem publicou</p>}
    <p className="post-copy">{post.content}</p>
    {post.photo && <Link className="post-photo" href={`/arenas/${arena.slug}`} aria-label={`Conhecer ${arena.name}`}>
      <Image src={post.photo} alt="Ilustração de uma arena de areia urbana ao pôr do sol." width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" />
      <span className="photo-arena-label">{arena.name} <ArrowUpRight size={15} aria-hidden="true" /></span>
    </Link>}
    {post.communityIds?.length ? <div className="post-context-links">{state.communities.filter(c => post.communityIds?.includes(c.id)).map(c => <Link href={`/comunidades/${c.slug}`} key={c.id}>{c.name}</Link>)}</div> : null}
    <footer className="post-actions">
      <div><button type="button" className={liked ? "post-action is-liked" : "post-action"} aria-label={liked ? `Descurtir post de ${author.name}` : `Curtir post de ${author.name}`} aria-pressed={liked} onClick={() => dispatch({ type: "like", postId: post.id })}><Heart size={21} fill={liked ? "currentColor" : "none"} aria-hidden="true" /><span>{post.likes + Number(liked)}</span></button>
      <button type="button" className="post-action" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={`Comentários do post de ${author.name}`}><MessageCircle size={21} aria-hidden="true" /><span>{comments.length}</span></button>{post.authorId !== me.id && <RepostControl demo reposted={reposted} author={author.name} audience={post.audience ?? "beta"} onChange={async reposted => { dispatch({ type: "repost", postId: post.id, reposted, now }); }} />}</div>
      <Link className="post-arena-link" href={`/arenas/${arena.slug}`}>{arena.name}</Link>
    </footer>
    {expanded && <section className="comments-section" aria-label="Comentários">
      <div className="comment-list" aria-live="polite">{comments.length === 0 && <p className="muted-text">Puxe a primeira resenha.</p>}{comments.map(c => { const player = state.players.find(p => p.id === c.authorId)!; return <div className="comment" key={c.id}><PlayerAvatar player={player} size="small" /><div><strong>{player.name}</strong><p>{c.content}</p></div></div>; })}</div>
      <form onSubmit={send} className="comment-form"><label className="sr-only" htmlFor={`comment-${post.id}`}>Escrever comentário</label><input id={`comment-${post.id}`} value={comment} onChange={e => setComment(e.target.value)} maxLength={280} placeholder="Entre na resenha…" required /><button type="submit" className="icon-button" aria-label="Enviar comentário" disabled={!comment.trim()}><Send size={19} /></button></form>
    </section>}
  </article>;
}

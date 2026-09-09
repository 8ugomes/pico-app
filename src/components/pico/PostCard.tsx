"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Send, ArrowUpRight } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { SportLabel } from "./SocialUI";
import { timeAgo } from "@/lib/demo-state";
import type { Post } from "@/types/social";

export function PostCard({ post }: { post: Post }) {
  const { state, dispatch, now, me } = useDemo();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const author = state.players.find(p => p.id === post.authorId)!;
  const arena = state.arenas.find(a => a.id === post.arenaId)!;
  const liked = state.likedPostIds.includes(post.id);
  const comments = state.comments.filter(c => c.postId === post.id);
  function send(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim() || comment.trim().length > 280) return;
    dispatch({ type: "comment", postId: post.id, content: comment, id: crypto.randomUUID(), now });
    setComment("");
  }
  return <article className="post-card">
    <header className="post-header">
      <Link href={author.id === me.id ? "/perfil" : `/perfil/${author.username}`} className="post-person"><PlayerAvatar player={author} /><span><strong>{author.name}</strong><small>{timeAgo(post.createdAt, now)}</small></span></Link>
      <SportLabel sport={post.sportId} />
    </header>
    <p className="post-copy">{post.content}</p>
    {post.photo && <Link className="post-photo" href={`/arenas/${arena.slug}`} aria-label={`Conhecer ${arena.name}`}>
      <Image src={post.photo} alt="Ilustração de uma arena de areia urbana ao pôr do sol." width={1440} height={960} sizes="(max-width: 700px) 100vw, 620px" />
      <span className="photo-arena-label">{arena.name} <ArrowUpRight size={15} aria-hidden="true" /></span>
    </Link>}
    <footer className="post-actions">
      <div><button type="button" className={liked ? "post-action is-liked" : "post-action"} aria-label={liked ? `Descurtir post de ${author.name}` : `Curtir post de ${author.name}`} aria-pressed={liked} onClick={() => dispatch({ type: "like", postId: post.id })}><Heart size={21} fill={liked ? "currentColor" : "none"} aria-hidden="true" /><span>{post.likes + Number(liked)}</span></button>
      <button type="button" className="post-action" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={`Comentários do post de ${author.name}`}><MessageCircle size={21} aria-hidden="true" /><span>{comments.length}</span></button></div>
      <Link className="post-arena-link" href={`/arenas/${arena.slug}`}>{arena.name}</Link>
    </footer>
    {expanded && <section className="comments-section" aria-label="Comentários">
      <div className="comment-list" aria-live="polite">{comments.length === 0 && <p className="muted-text">Puxe a primeira resenha.</p>}{comments.map(c => { const player = state.players.find(p => p.id === c.authorId)!; return <div className="comment" key={c.id}><PlayerAvatar player={player} size="small" /><div><strong>{player.name}</strong><p>{c.content}</p></div></div>; })}</div>
      <form onSubmit={send} className="comment-form"><label className="sr-only" htmlFor={`comment-${post.id}`}>Escrever comentário</label><input id={`comment-${post.id}`} value={comment} onChange={e => setComment(e.target.value)} maxLength={280} placeholder="Entre na resenha…" required /><button type="submit" className="icon-button" aria-label="Enviar comentário" disabled={!comment.trim()}><Send size={19} /></button></form>
    </section>}
  </article>;
}

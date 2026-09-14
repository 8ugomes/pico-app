'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RepostAttribution, RepostControl } from '../RepostControl';
import { RemoteAvatar } from './Media';
import { SafetyActions } from './SafetyActions';
import { Heart, MessageCircle, Send, Globe2, LockKeyhole } from 'lucide-react';
import { personTone } from '@/lib/person-tone';
import type { ReadComment } from '@/types/read';
import { Button } from '@/components/ui/Button';
import type { PostRecord, FeedData } from '@/types/posts';
import { Modal } from '@/components/ui/Modal';
import { useEntity, entityAction } from './useEntity';
import { PublicationComposer } from './PublicationComposer';
import { formatGameDate } from '@/lib/game-date';
import { ConnectedHomeContexts } from './ConnectedHomeContexts';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { useMutation, MutationNotice } from './useMutation';
export function ConnectedFeed({ arenaId, communityId, authorId, postId, readOnly = false, moderate }: { initialSlug?: string; arenaId?: string; communityId?: string; authorId?: string; postId?: string; readOnly?: boolean; moderate?: { arena?: string; community?: string } }) {
  const [offset, setOffset] = useState(0);
  const { data, error, reload } = useEntity<FeedData>(`/api/posts?offset=${offset}${arenaId ? '&arena=' + arenaId : ''}${communityId ? '&community=' + communityId : ''}${authorId ? '&author=' + authorId : ''}${postId ? '&post=' + postId : ''}`);
  const home = !arenaId && !communityId && !authorId && !postId;
  return <>
    {home && (data ? <ConnectedHomeContexts viewerId={data.viewerId} /> : <PageHeading title="Seu Pico." />)}
    {postId && <Link className="detail-back" href="/feed">← Início</Link>}
    {error && <section className="read-message"><p role="alert">{error}</p><Button variant="secondary" onClick={reload}>Tentar novamente</Button></section>}
    {!data && !error && <ReadLoading />}
    {data && <>
      {!readOnly && <PublicationComposer viewerId={data.viewerId} arenaId={arenaId} communityId={communityId} onDone={() => { setOffset(0); reload(); }} />}
      <div className="list-heading"><h2>{postId ? 'Publicação' : arenaId || communityId ? 'Mural' : 'Publicações'}</h2><Button size="small" variant="quiet" onClick={reload}>Atualizar</Button></div>
      {!data.posts.length && <div className="feed-empty">{(arenaId || communityId) && !postId ? <p className="muted-text">Nenhuma publicação por aqui ainda.</p> : <EmptyState title={postId ? 'Publicação indisponível.' : 'Sua turma aparece aqui.'}>{postId ? 'Ela pode ter sido removida ou não estar disponível para sua conta.' : readOnly ? 'Nenhuma publicação por aqui ainda.' : 'Acompanhe pessoas para trazer a conversa para o seu Início.'}</EmptyState>}{home && <Link className="journey-text-link" href="/descobrir">Conhecer pessoas que jogam <Send size={16} aria-hidden="true" /></Link>}</div>}
      <div className="feed-posts">{data.posts.map(post => <ConnectedPost key={`${data.viewerId}:${post.id}`} post={post} viewerId={data.viewerId} refresh={reload} moderate={moderate} />)}</div>
      {(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de publicações"><Button variant="secondary" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><Button disabled={!data.hasMore} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}
    </>}
  </>;
}
function ConnectedPost({ post, viewerId, refresh, moderate }: { post: PostRecord; viewerId:string; refresh: () => void; moderate?:{arena?:string;community?:string} }) {
  const [expanded, setExpanded] = useState(false);
  const mutation = useMutation();
  const [removing, setRemoving] = useState(false);
  return <article className="post-card" data-person-tone={personTone(post.author_id)}>
    {post.repost && <RepostAttribution name={post.repost.player_id === viewerId ? "Você" : post.repost.display_name} href={`/perfil/${post.repost.username}`} createdAt={post.repost.created_at} />}
    <header className="post-header"><Link href={`/perfil/${post.username}`} className="post-person"><RemoteAvatar src={post.avatar} name={post.display_name} /><span><strong>{post.display_name}</strong><small><time dateTime={post.created_at} title="Data da publicação">{new Date(post.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></small></span></Link><SafetyActions target="post" id={post.id} own={viewerId === post.author_id} playerId={post.author_id} name={post.display_name} edit={{body:post.body,maxLength:500,save:async body => { await entityAction('/api/posts',{action:'edit',id:post.id,body},AbortSignal.timeout(15000)); }}} onRemoveFromWall={moderate ? () => setRemoving(true) : undefined} onChange={refresh} /></header>
    <div className="post-meta">{post.sport_slug && <span className="sport-label"><SportIcon sport={post.sport_slug} />{post.sport_name}</span>}<Link className="post-audience" href={`/publicacoes/${post.id}`}>{post.audience === 'private' ? <LockKeyhole size={13} aria-hidden="true" /> : <Globe2 size={13} aria-hidden="true" />}{post.audience === 'private' ? 'Participantes do grupo privado' : 'Pessoas do Pico'}<span className="sr-only"> · Abrir publicação</span></Link></div>
    {post.game_played_on && <p className="post-game-date">Jogado em <time dateTime={post.game_played_on}>{formatGameDate(post.game_played_on)}</time> · relato de quem publicou</p>}
    <p className="post-copy">{post.body}</p>
    {post.destinations.some(d => d.community_slug) && <div className="post-context-links">{post.destinations.filter(d => d.community_slug).map(d => <Link key={d.community_id} href={`/comunidades/${d.community_slug}`}>{d.community_name}</Link>)}</div>}
    {post.image && <Image className="post-photo" unoptimized src={post.image} width={800} height={600} alt={`Foto da publicação de ${post.display_name}`} />}
    {post.video && <video className="post-video" controls preload="metadata" playsInline src={post.video} aria-label={`Vídeo da publicação de ${post.display_name}`} />}
    <footer className="post-actions"><div><button className={`post-action ${post.liked ? 'is-liked' : ''}`} disabled={mutation.busy} aria-label={`${post.liked ? 'Descurtir' : 'Curtir'} post de ${post.display_name}`} aria-pressed={post.liked} onClick={async () => { if (await mutation.run({ action: 'set_like', postId: post.id, liked: !post.liked }, post.liked ? 'Curtida removida.' : 'Post curtido.')) refresh(); }}><Heart size={21} fill={post.liked ? 'currentColor' : 'none'} aria-hidden="true" /><span>{post.like_count}</span></button><button className="post-action" aria-expanded={expanded} aria-label={`Comentários do post de ${post.display_name}`} onClick={() => setExpanded(!expanded)}><MessageCircle size={21} aria-hidden="true" /><span>{post.comment_count}</span></button>{(post.can_repost || post.reposted) && <RepostControl reposted={post.reposted} author={post.display_name} audience={post.audience} onChange={async reposted => { await entityAction("/api/posts", { action: "repost", id: post.id, reposted }, AbortSignal.timeout(15000)).catch(e => { if (e instanceof TypeError || e?.name === "TimeoutError" || e?.name === "AbortError") throw Error("Não foi possível confirmar. Atualize a publicação para conferir antes de tentar de novo."); throw e; }); refresh(); }} />}</div>{post.arena_slug&&<Link className="post-arena-link" href={`/arenas/${post.arena_slug}`}>{post.arena_name}{post.arena_is_demo ? ' · Demo' : ''}</Link>}</footer>
    <MutationNotice compact message={mutation.message} />
    {moderate && <RemoveDistribution open={removing} onClose={() => setRemoving(false)} postId={post.id} scope={moderate} onDone={refresh} />}
    {expanded && <ConnectedComments postId={post.id} onChange={refresh} />}
  </article>;
}
function ConnectedComments({ postId, onChange }: { postId: string; onChange: () => void }) {
  const [offset, setOffset] = useState(0);
  const [body, setBody] = useState('');
  const { state, retry, refresh } = useRemoteRead(`resource=comments&postId=${postId}&offset=${offset}`);
  const mutation = useMutation();
  const data = state.status === 'success' && state.data.kind === 'comments' ? state.data : null;
  return <section className="comments-section" aria-label="Comentários">
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <><div className="comment-list">{data.comments.map(c => <ConnectedComment key={c.id} comment={c} viewerId={data.viewerId} onChange={() => { refresh(); onChange(); }} />)}{!data.comments.length && <p className="muted-text">Puxe a primeira resenha.</p>}</div>{(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de comentários"><Button size="small" variant="quiet" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><Button size="small" variant="quiet" disabled={!data.hasMore} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}</>}
    <form className="comment-form" onSubmit={async e => { e.preventDefault(); if (await mutation.run({ action: 'create_comment', postId, body }, 'Comentário enviado.')) { setBody(''); refresh(); onChange(); } }}><label className="sr-only" htmlFor={`real-comment-${postId}`}>Escrever comentário</label><input id={`real-comment-${postId}`} placeholder="Entre na resenha…" value={body} onChange={e => setBody(e.target.value)} maxLength={280} required disabled={mutation.busy} /><button className="icon-button" type="submit" aria-label="Enviar comentário" disabled={mutation.busy || !body.trim()}><Send size={19} aria-hidden="true" /></button></form>
    <MutationNotice compact message={mutation.message} />
  </section>;
}

function ConnectedComment({ comment, viewerId, onChange }: { comment: ReadComment; viewerId: string; onChange: () => void }) {
  const own = comment.authorId === viewerId;
  return <article className="comment" data-person-tone={personTone(comment.authorId)} data-own={own}>
    <Link className="comment-avatar" href={`/perfil/${comment.username}`} aria-label={`Perfil de ${comment.name}`}><RemoteAvatar src={comment.avatar} name={comment.name} /></Link>
    <div className="comment-bubble"><header className="comment-header"><div className="comment-identity"><Link href={`/perfil/${comment.username}`}><strong>{comment.name}</strong></Link><span className="comment-time"><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</time>{own && <span className="comment-own">Você</span>}</span></div>
      <SafetyActions target="comment" id={comment.id} own={own} playerId={comment.authorId} name={comment.name} edit={{body:comment.body,maxLength:280,save:async body => { await entityAction('/api/social/mutate',{action:'edit_comment',id:comment.id,body},AbortSignal.timeout(15000)); }}} onChange={onChange} />
    </header><p>{comment.body}</p></div>
  </article>;
}
function RemoveDistribution({ open, onClose, postId, scope, onDone }: { open: boolean; onClose: () => void; postId: string; scope: { arena?: string; community?: string }; onDone: () => void }) {
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  return <Modal open={open} onClose={() => { if(!busy) onClose(); }} title="Retirar deste mural"><p>A publicação permanece nos demais destinos e mantém seus comentários e curtidas.</p><Button disabled={busy} onClick={async()=>{setBusy(true);setMessage('');try{await entityAction('/api/posts',{action:'remove_distribution',id:postId,...scope},AbortSignal.timeout(15000));onClose();onDone()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível retirar.')}finally{setBusy(false)}}}>{busy?'Retirando…':'Confirmar retirada'}</Button>{message&&<p role="alert">{message}</p>}</Modal>;
}

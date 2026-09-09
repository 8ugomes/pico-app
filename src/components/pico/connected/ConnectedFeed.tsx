'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PhotoUpload, RemoteAvatar } from './Media';
import { SafetyActions } from './SafetyActions';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ReadArena } from '@/types/read';
import type { FeedRow } from '@/types/read';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading, ConnectedSource } from './ReadState';
import { ArenaSportPicker } from './ArenaSportPicker';
import { useMutation, MutationNotice } from './useMutation';
export function ConnectedFeed({ initialSlug, arenaId }: { initialSlug?: string; arenaId?: string }) {
  const [offset, setOffset] = useState(0);
  const { state, retry, refresh, refreshing } = useRemoteRead(`resource=feed&offset=${offset}${arenaId ? `&arenaId=${arenaId}` : ''}`);
  const [selection, setSelection] = useState<{ arena: ReadArena; sportId: string } | null>(null);
  const [draft, setDraft] = useState({ viewerId: '', body: '' });
  const [photo, setPhoto] = useState<{viewerId:string;path:string|null}>({viewerId:'',path:null});
  const [uploading,setUploading]=useState(false);
  const mutation = useMutation();
  const data = state.status === 'success' && state.data.kind === 'feed' ? state.data : null;
  const imagePath=photo.viewerId===data?.viewerId?photo.path:null;
  const body = draft.viewerId === data?.viewerId ? draft.body : '';
  const setBody = (value: string) => setDraft({ viewerId: data?.viewerId ?? '', body: value });
  return <>
    {!arenaId && <PageHeading eyebrow="A RESENHA COMEÇA AQUI" title="Seu feed." />}
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <>
      <ConnectedSource />
      <section className="connected-panel"><h2>Bora jogar?</h2><form className="connected-form" onSubmit={async e => { e.preventDefault(); if (selection && await mutation.run({ action: 'create_post', arenaId: selection.arena.id, sportId: selection.sportId, body, imagePath }, 'Publicado no Pico.')) { setBody(''); setPhoto({viewerId:'',path:null}); setOffset(0); refresh(); } }}><fieldset disabled={mutation.busy}>
        <label className="input-group">Sua publicação<textarea className="input" value={body} onChange={e => setBody(e.target.value)} maxLength={500} placeholder="Chama a turma, conta do jogo…" required rows={3} /></label>
        <span className="input-hint">{body.length}/500</span>
        <ArenaSportPicker initialSlug={initialSlug} value={selection} onChange={setSelection} />
        <PhotoUpload key={data.viewerId} bucket="post-media" path={imagePath} onChange={path=>setPhoto({viewerId:data.viewerId,path})} onBusy={setUploading} />
        <Button type="submit" disabled={uploading || !body.trim() || !selection?.sportId}>{mutation.busy ? 'Publicando…' : 'Publicar'}</Button>
      </fieldset></form><MutationNotice message={mutation.message} /></section>
      <div className="list-heading"><h2>{arenaId ? 'Mural da arena' : 'Pela comunidade'}</h2><Button size="small" variant="quiet" disabled={refreshing} onClick={refresh}>{refreshing ? 'Atualizando…' : 'Atualizar'}</Button></div>
      {!data.posts.length && <EmptyState title="O primeiro papo pode ser seu.">Publique um convite ou conte como foi o jogo.</EmptyState>}
      <div className="feed-posts">{data.posts.map(post => <ConnectedPost key={`${data.viewerId}:${post.id}`} post={post} viewerId={data.viewerId} refresh={refresh} />)}</div>
      {(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas do feed"><Button variant="secondary" size="small" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><span>Página {offset / 20 + 1}</span><Button variant="secondary" size="small" disabled={!data.hasMore} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}
    </>}
  </>;
}
function ConnectedPost({ post, viewerId, refresh }: { post: FeedRow; viewerId:string; refresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const mutation = useMutation();
  return <article className="post-card">
    <header className="post-header"><Link href={`/perfil/${post.username}`} className="post-person"><RemoteAvatar src={post.avatar} name={post.display_name} /><span><strong>{post.display_name}</strong><small><time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></small></span></Link><span className="sport-label"><SportIcon sport={post.sport_slug} />{post.sport_name}</span></header>
    <p className="post-copy">{post.body}</p>
    {post.image && <Image className="post-photo" unoptimized src={post.image} width={800} height={600} alt={`Foto da publicação de ${post.display_name}`} />}
    <footer className="post-actions"><div><button className={`post-action ${post.liked ? 'is-liked' : ''}`} disabled={mutation.busy} aria-label={`${post.liked ? 'Descurtir' : 'Curtir'} post de ${post.display_name}`} aria-pressed={post.liked} onClick={async () => { if (await mutation.run({ action: 'set_like', postId: post.id, liked: !post.liked }, post.liked ? 'Curtida removida.' : 'Post curtido.')) refresh(); }}><Heart size={21} fill={post.liked ? 'currentColor' : 'none'} aria-hidden="true" /><span>{post.like_count}</span></button><button className="post-action" aria-expanded={expanded} aria-label={`Comentários do post de ${post.display_name}`} onClick={() => setExpanded(!expanded)}><MessageCircle size={21} aria-hidden="true" /><span>{post.comment_count}</span></button></div><Link className="post-arena-link" href={`/arenas/${post.arena_slug}`}>{post.arena_name}{post.arena_is_demo ? ' · Demo' : ''}</Link></footer>
    <MutationNotice compact message={mutation.message} />
    <SafetyActions target="post" id={post.id} own={viewerId===post.author_id} playerId={post.author_id} onChange={refresh} />
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
    {data && <><div className="comment-list">{data.comments.map(c => <div key={c.id} className="comment"><div><strong>{c.name}</strong><p>{c.body}</p><SafetyActions target="comment" id={c.id} own={c.authorId===data.viewerId} playerId={c.authorId} onChange={()=>{refresh();onChange();}} /></div></div>)}{!data.comments.length && <p className="muted-text">Puxe a primeira resenha.</p>}</div>{(offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de comentários"><Button size="small" variant="quiet" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><Button size="small" variant="quiet" disabled={!data.hasMore} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}</>}
    <form className="comment-form" onSubmit={async e => { e.preventDefault(); if (await mutation.run({ action: 'create_comment', postId, body }, 'Comentário enviado.')) { setBody(''); refresh(); onChange(); } }}><label className="sr-only" htmlFor={`real-comment-${postId}`}>Escrever comentário</label><input id={`real-comment-${postId}`} placeholder="Entre na resenha…" value={body} onChange={e => setBody(e.target.value)} maxLength={280} required disabled={mutation.busy} /><button className="icon-button" type="submit" aria-label="Enviar comentário" disabled={mutation.busy || !body.trim()}><Send size={19} aria-hidden="true" /></button></form>
    <MutationNotice compact message={mutation.message} />
  </section>;
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RemoteAvatar } from './Media';
import { SafetyActions } from './SafetyActions';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { PostRecord, FeedData } from '@/types/posts';
import { Modal } from '@/components/ui/Modal';
import { useEntity, entityAction } from './useEntity';
import { PublicationComposer } from './PublicationComposer';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { useMutation, MutationNotice } from './useMutation';
export function ConnectedFeed({arenaId,communityId,authorId,postId,readOnly=false,moderate}:{initialSlug?:string;arenaId?:string;communityId?:string;authorId?:string;postId?:string;readOnly?:boolean;moderate?:{arena?:string;community?:string}}){
 const[offset,setOffset]=useState(0);const{data,error,reload}=useEntity<FeedData>(`/api/posts?offset=${offset}${arenaId?'&arena='+arenaId:''}${communityId?'&community='+communityId:''}${authorId?'&author='+authorId:''}${postId?'&post='+postId:''}`);
 return <>{!arenaId&&!communityId&&!authorId&&!postId&&<PageHeading eyebrow="A RESENHA COMEÇA AQUI" title="Seu feed."/>}{error&&<p role="alert">{error}</p>}{!data&&!error&&<ReadLoading/>}{data&&<>{!readOnly&&<PublicationComposer viewerId={data.viewerId} arenaId={arenaId} communityId={communityId} onDone={()=>{setOffset(0);reload()}}/>}<div className="list-heading"><h2>{arenaId||communityId?'Mural':authorId?'Publicações':'Pela comunidade'}</h2><Button size="small" variant="quiet" onClick={reload}>Atualizar</Button></div>{!data.posts.length&&<EmptyState title="Ainda não há publicações por aqui.">Apenas conteúdo disponível para sua conta aparece aqui.</EmptyState>}<div className="feed-posts">{data.posts.map(post=><ConnectedPost key={`${data.viewerId}:${post.id}`} post={post} viewerId={data.viewerId} refresh={reload} moderate={moderate}/>)}</div>{(offset>0||data.hasMore)&&<nav className="read-pagination" aria-label="Páginas de publicações"><Button variant="secondary" disabled={!offset} onClick={()=>setOffset(offset-20)}>Anterior</Button><Button disabled={!data.hasMore} onClick={()=>setOffset(offset+20)}>Próxima</Button></nav>}</>}</>;
}
function ConnectedPost({ post, viewerId, refresh, moderate }: { post: PostRecord; viewerId:string; refresh: () => void; moderate?:{arena?:string;community?:string} }) {
  const [expanded, setExpanded] = useState(false);
  const mutation = useMutation();
  return <article className="post-card">
    <header className="post-header"><Link href={`/perfil/${post.username}`} className="post-person"><RemoteAvatar src={post.avatar} name={post.display_name} /><span><strong>{post.display_name}</strong><small><time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></small></span></Link>{post.sport_slug&&<span className="sport-label"><SportIcon sport={post.sport_slug} />{post.sport_name}</span>}</header>
    <p className="form-note">{post.audience==='private'?'Comunidade privada':'Público no beta'} · <Link href={`/publicacoes/${post.id}`}>Abrir publicação</Link></p>
    <p className="post-copy">{post.body}</p>
    {post.image && <Image className="post-photo" unoptimized src={post.image} width={800} height={600} alt={`Foto da publicação de ${post.display_name}`} />}
    <footer className="post-actions"><div><button className={`post-action ${post.liked ? 'is-liked' : ''}`} disabled={mutation.busy} aria-label={`${post.liked ? 'Descurtir' : 'Curtir'} post de ${post.display_name}`} aria-pressed={post.liked} onClick={async () => { if (await mutation.run({ action: 'set_like', postId: post.id, liked: !post.liked }, post.liked ? 'Curtida removida.' : 'Post curtido.')) refresh(); }}><Heart size={21} fill={post.liked ? 'currentColor' : 'none'} aria-hidden="true" /><span>{post.like_count}</span></button><button className="post-action" aria-expanded={expanded} aria-label={`Comentários do post de ${post.display_name}`} onClick={() => setExpanded(!expanded)}><MessageCircle size={21} aria-hidden="true" /><span>{post.comment_count}</span></button></div>{post.arena_slug&&<Link className="post-arena-link" href={`/arenas/${post.arena_slug}`}>{post.arena_name}{post.arena_is_demo ? ' · Demo' : ''}</Link>}</footer>
    <MutationNotice compact message={mutation.message} />
    <SafetyActions target="post" id={post.id} own={viewerId===post.author_id} playerId={post.author_id} onChange={refresh} />
    {viewerId===post.author_id&&<EditPost post={post} onDone={refresh}/>}
    {moderate&&<RemoveDistribution postId={post.id} scope={moderate} onDone={refresh}/>}
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

function EditPost({post,onDone}:{post:PostRecord;onDone:()=>void}){const[open,setOpen]=useState(false),[body,setBody]=useState(post.body),[busy,setBusy]=useState(false),[message,setMessage]=useState('');return <><Button size="small" variant="quiet" onClick={()=>setOpen(true)}>Editar publicação</Button><Modal open={open} onClose={()=>{if(!busy)setOpen(false)}} title="Editar publicação"><form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await entityAction('/api/posts',{action:'edit',id:post.id,body});setOpen(false);onDone()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setBusy(false)}}}><label className="input-group">Texto<textarea className="input" maxLength={500} required value={body} onChange={e=>setBody(e.target.value)}/></label><Button type="submit" disabled={busy}>Salvar alteração</Button><p role="status">{message}</p></form></Modal></>}
function RemoveDistribution({postId,scope,onDone}:{postId:string;scope:{arena?:string;community?:string};onDone:()=>void}){const[open,setOpen]=useState(false),[message,setMessage]=useState('');return <><Button size="small" variant="quiet" onClick={()=>setOpen(true)}>Retirar deste mural</Button><Modal open={open} onClose={()=>setOpen(false)} title="Retirar deste mural"><p>A publicação permanece nos demais destinos e mantém seus comentários e curtidas.</p><Button onClick={async()=>{try{await entityAction('/api/posts',{action:'remove_distribution',id:postId,...scope});setOpen(false);onDone()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível retirar.')}}}>Confirmar retirada</Button><p role="status">{message}</p></Modal></>}

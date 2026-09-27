/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CircleEllipsis,
  Download,
  Heart,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  ShieldAlert,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { api, PicoApiError, query } from './api';
import { attempts } from './attempts';
import { legalUrls, mobileConfig } from './config';
import { drafts, type GameDraft, type PublicationDraft } from './drafts';
import { choosePhoto, openExternal, selectionHaptic, shareExport, sharePost, successHaptic } from './native';
import { CommentsAction, RepostAction } from './social-actions';
import { MobileVideoUpload, removeMobileVideo } from './video-upload';
import type { AccountData, Arena, Community, Loadable, PlayedGame, Player, Post, Profile, PublicationOptions, Sport } from './types';
import { Avatar, Button, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, Notice, PrivateImage, dateLabel, errorMessage } from './ui';

function useRemote<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<Loadable<T>>({ status: 'loading', data: null, message: '' });
  useEffect(() => {
    let active = true;
    void api.request<T>(path).then((data) => {
      if (active) setState({ status: 'ready', data, message: '' });
    }).catch((cause) => {
      if (active) setState((previous) => ({ status: 'error', data: previous.data, message: errorMessage(cause) }));
    });
    return () => { active = false; };
  }, [path, revision]);
  return { ...state, reload: () => setRevision((value) => value + 1) };
}

function ScreenHeading({ id, eyebrow, title, action }: { id: string; eyebrow?: string; title: string; action?: ReactNode }) {
  return <header className="screen-heading"><div>{eyebrow && <span>{eyebrow}</span>}<h1 id={id}>{title}</h1></div>{action}</header>;
}

export function HomeScreen({ online, videoPublishing, targetPostId, onClearTarget }: { online: boolean; videoPublishing: boolean; targetPostId?: string; onClearTarget: () => void }) {
  if (targetPostId) return <PostDetail key={targetPostId} id={targetPostId} online={online} onBack={onClearTarget} />;
  return <HomeFeed online={online} videoPublishing={videoPublishing} />;
}

function HomeFeed({ online, videoPublishing }: { online: boolean; videoPublishing: boolean }) {
  const feed = useRemote<{ posts: Post[]; hasMore: boolean; viewerId: string }>('/posts');
  const options = useRemote<PublicationOptions>('/posts?kind=options');
  const [composerOpen, setComposerOpen] = useState(false);
  return <section className="screen" aria-labelledby="home-title">
    <ScreenHeading id="home-title" eyebrow="AGORA NA AREIA" title="Início" action={<Button onClick={() => setComposerOpen(true)}><Plus size={18} aria-hidden="true" />Publicar</Button>} />
    <PublicationComposer open={composerOpen} options={options.data} optionsError={options.status === 'error' ? options.message : ''} reloadOptions={options.reload} online={online} videoPublishing={videoPublishing} onClose={() => setComposerOpen(false)} onPublished={() => { setComposerOpen(false); feed.reload(); }} />
    {feed.status === 'loading' && !feed.data && <LoadingState>Buscando novidades…</LoadingState>}
    {feed.status === 'error' && <ErrorState message={feed.message} onRetry={feed.reload} />}
    {feed.data?.posts.length === 0 && <EmptyState title="A areia está tranquila por aqui.">Quando as pessoas que você acompanha publicarem, as novidades aparecem aqui.</EmptyState>}
    <div className="feed-list">{feed.data?.posts.map((post) => <PostItem key={post.id} post={post} online={online} onChanged={feed.reload} />)}</div>
  </section>;
}

function PostDetail({ id, online, onBack }: { id: string; online: boolean; onBack: () => void }) {
  const result = useRemote<{ posts: Post[]; hasMore: boolean; viewerId: string }>(query('/posts', { post: id }));
  return <section className="screen" aria-labelledby="post-detail-title">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={19} aria-hidden="true" />Início</button>
    <ScreenHeading id="post-detail-title" eyebrow="PUBLICAÇÃO" title="Na areia" />
    {result.status === 'loading' && !result.data && <LoadingState>Abrindo publicação…</LoadingState>}
    {result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}
    {result.data?.posts.length === 0 && <EmptyState title="Publicação indisponível.">Ela pode ter sido removida ou não fazer parte da sua audiência.</EmptyState>}
    <div className="feed-list">{result.data?.posts.map((post) => <PostItem key={post.id} post={post} online={online} onChanged={result.reload} />)}</div>
  </section>;
}

function PublicationComposer({ open, options, optionsError, reloadOptions, online, videoPublishing, onClose, onPublished }: { open: boolean; options: PublicationOptions | null; optionsError: string; reloadOptions: () => void; online: boolean; videoPublishing: boolean; onClose: () => void; onPublished: () => void }) {
  const accountId = api.user?.id || '';
  const draftRef = useRef<PublicationDraft | null>(null);
  const uploadController = useRef<AbortController | null>(null);
  const [draft, setDraft] = useState<PublicationDraft>(newPublicationDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [draftError, setDraftError] = useState('');
  const { body, audience, wallArena, groups, mediaKind, imagePath, videoPath } = draft;

  useEffect(() => {
    let active = true;
    if (!accountId) return;
    void drafts.loadPublication(accountId).then((stored) => {
      if (!active) return;
      let next = stored || newPublicationDraft();
      if (!videoPublishing && next.mediaKind === 'video') {
        if (next.videoPath) void removeMobileVideo(next.videoPath).catch(() => undefined);
        next = { ...next, mediaKind: 'photo', videoPath: null };
        void drafts.savePublication(accountId, next).catch(() => undefined);
      }
      draftRef.current = next;
      setDraft(next);
      setRestored(Boolean(stored));
      setDraftReady(true);
    }).catch(() => {
      if (!active) return;
      const next = newPublicationDraft();
      draftRef.current = next;
      setDraft(next);
      setDraftError('Não foi possível retomar o rascunho neste aparelho.');
      setDraftReady(true);
    });
    return () => { active = false; };
  }, [accountId, videoPublishing]);

  useEffect(() => () => uploadController.current?.abort(), []);

  function updateDraft(change: (current: PublicationDraft) => PublicationDraft) {
    if (!draftRef.current) return;
    const next = change(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setRestored(false);
    if (!accountId || !draftReady) return;
    void drafts.savePublication(accountId, next).catch(() => {
      setDraftError('Não foi possível guardar o rascunho neste aparelho.');
    });
  }

  async function addPhoto() {
    setUploading(true);
    setError('');
    try {
      const photo = await choosePhoto(false);
      const controller = new AbortController();
      uploadController.current = controller;
      const path = await api.uploadMedia('post-media', photo, controller.signal);
      const previousPath = draftRef.current?.imagePath;
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(photo));
      updateDraft((current) => ({ ...current, imagePath: path }));
      if (previousPath && previousPath !== path) {
        await api.request('/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: previousPath, bucket: 'post-media' }) }).catch(() => undefined);
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      uploadController.current = null;
      setUploading(false);
    }
  }

  async function removePhoto() {
    if (imagePath) {
      await api.request('/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: imagePath, bucket: 'post-media' }) }).catch(() => undefined);
    }
    if (preview) URL.revokeObjectURL(preview);
    updateDraft((current) => ({ ...current, imagePath: null }));
    setPreview('');
  }

  async function changeMediaKind(next: 'photo' | 'video') {
    if (next === mediaKind || busy || uploading) return;
    setUploading(true); setError('');
    try {
      if (next === 'video' && imagePath) await removePhoto();
      if (next === 'photo' && videoPath) await removeMobileVideo(videoPath);
      updateDraft((current) => ({ ...current, mediaKind: next, imagePath: next === 'video' ? null : current.imagePath, videoPath: next === 'photo' ? null : current.videoPath }));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = draftRef.current;
    if (!current) return;
    const text = current.body.trim();
    if (!text || busy || !options) return;
    const payload = {
      action: 'publish',
      body: text,
      imagePath: current.mediaKind === 'photo' ? current.imagePath : null,
      videoPath: videoPublishing && current.mediaKind === 'video' ? current.videoPath : null,
      audience: current.audience,
      wallArena: current.wallArena || undefined,
      groups: current.groups,
      mentionCommunity: undefined,
      mentionPeople: [],
      mentionEveryone: false,
    };
    setBusy(true);
    setError('');
    try {
      await api.request('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, key: current.idempotencyKey }),
      });
      const cleared = await drafts.confirmPublication(accountId, current.idempotencyKey);
      if (!cleared) throw new Error('A publicação foi confirmada, mas o rascunho local ainda precisa ser limpo. Tente publicar novamente; ele não será duplicado.');
      if (preview) URL.revokeObjectURL(preview);
      const next = newPublicationDraft();
      draftRef.current = next;
      setDraft(next);
      setRestored(false);
      setPreview('');
      await successHaptic();
      onPublished();
    } catch (cause) {
      setError(`${errorMessage(cause)} Seu rascunho foi mantido.`);
    } finally {
      setBusy(false);
    }
  }

  return <Modal open={open} title="Nova publicação" onClose={() => { if (!busy && !uploading) onClose(); }}>
    {!draftReady ? <LoadingState>Retomando seu rascunho…</LoadingState> :
    <form className="compose-form" onSubmit={submit}>
      {restored && <Notice>Seu rascunho deste aparelho foi retomado.</Notice>}
      <Field label="O que aconteceu na areia?"><textarea autoFocus value={body} onChange={(event) => updateDraft((current) => ({ ...current, body: event.target.value }))} maxLength={500} rows={5} placeholder="Conta do seu jeito." /></Field>
      <span className="character-count">{body.length}/500</span>
      {videoPublishing && <fieldset className="media-choice"><legend>Mídia (opcional)</legend><label><input type="radio" name="media-kind" checked={mediaKind === 'photo'} disabled={uploading || busy} onChange={() => void changeMediaKind('photo')} />Foto</label><label><input type="radio" name="media-kind" checked={mediaKind === 'video'} disabled={uploading || busy} onChange={() => void changeMediaKind('video')} />Vídeo</label></fieldset>}
      {mediaKind === 'photo' && <>{preview && <div className="compose-preview"><img src={preview} alt="Foto escolhida para a publicação" /><IconButton type="button" label="Remover foto" onClick={() => void removePhoto()}><X size={19} aria-hidden="true" /></IconButton></div>}{imagePath && !preview && <Notice>Uma foto já está anexada a este rascunho.</Notice>}<div className="compose-tools"><Button type="button" variant="secondary" disabled={uploading || busy} onClick={addPhoto}>{uploading ? <LoaderCircle className="spinner" size={18} aria-hidden="true" /> : <ImageIcon size={18} aria-hidden="true" />}{uploading ? 'Enviando foto…' : imagePath ? 'Trocar foto' : 'Adicionar foto'}</Button>{uploading && <Button type="button" variant="quiet" onClick={() => uploadController.current?.abort()}>Cancelar envio</Button>}{imagePath && !preview && <Button type="button" variant="quiet" disabled={uploading || busy} onClick={() => void removePhoto()}>Remover foto</Button>}</div></>}
      {videoPublishing && mediaKind === 'video' && <MobileVideoUpload path={videoPath} disabled={busy || !online} onBusy={setUploading} onChange={(path) => updateDraft((current) => ({ ...current, videoPath: path }))} />}
      <details className="publication-settings"><summary>Quem pode ver e onde aparece</summary><div>
        <Field label="Audiência"><select value={audience} onChange={(event) => { const next = event.target.value as 'beta' | 'private'; updateDraft((current) => ({ ...current, audience: next, groups: [], wallArena: next === 'private' ? '' : current.wallArena })); }}><option value="beta">Pessoas do Pico</option><option value="private">Participantes de um grupo privado</option></select></Field>
        {audience === 'beta' && <Field label="Mural de arena (opcional)"><select value={wallArena} onChange={(event) => updateDraft((current) => ({ ...current, wallArena: event.target.value }))}><option value="">Só no meu perfil</option>{options?.arenas.map((arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}</select></Field>}
        <fieldset className="choice-field"><legend>{audience === 'private' ? 'Grupo privado' : 'Comunidades (até 5)'}</legend>{options?.communities.filter((community) => community.visibility === audience).map((community) => <label key={community.id}><input type={audience === 'private' ? 'radio' : 'checkbox'} name="group" checked={groups.includes(community.id)} onChange={() => updateDraft((current) => ({ ...current, groups: audience === 'private' ? [community.id] : current.groups.includes(community.id) ? current.groups.filter((id) => id !== community.id) : current.groups.length < 5 ? [...current.groups, community.id] : current.groups }))} />{community.name}</label>)}</fieldset>
        <p className="privacy-note">{audience === 'private' ? 'Só participantes ativos do grupo escolhido podem abrir.' : 'A publicação aparece no seu perfil e para pessoas do Pico.'}</p>
      </div></details>
      {audience === 'private' && groups.length !== 1 && <Notice tone="warning">Escolha um grupo privado antes de publicar.</Notice>}
      {!online && <Notice tone="warning">Conecte-se para publicar. O rascunho continua aqui.</Notice>}
      {optionsError && <ErrorState message={optionsError} onRetry={reloadOptions} />}
      {!options && !optionsError && <LoadingState>Conferindo onde você pode publicar…</LoadingState>}
      {draftError && <ErrorState message={draftError} />}
      {error && <ErrorState message={error} />}
      <div className="form-actions"><Button type="button" variant="quiet" onClick={onClose} disabled={busy || uploading}>Continuar depois</Button><Button type="submit" disabled={!online || busy || uploading || !body.trim() || !options || (audience === 'private' && groups.length !== 1)}>{busy ? <LoaderCircle className="spinner" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}{busy ? 'Publicando…' : 'Publicar'}</Button></div>
    </form>}
  </Modal>;
}

function newPublicationDraft(): PublicationDraft {
  return { idempotencyKey: crypto.randomUUID(), body: '', audience: 'beta', wallArena: '', groups: [], mediaKind: 'photo', imagePath: null, videoPath: null };
}

function PostItem({ post, online, onChanged }: { post: Post; online: boolean; onChanged: () => void }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.like_count);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoError, setVideoError] = useState('');
  const own = api.user?.id === post.author_id;
  async function like() {
    if (busy || !online) return;
    const next = !liked;
    setLiked(next);
    setLikes((value) => Math.max(0, value + (next ? 1 : -1)));
    setBusy(true);
    try {
      await api.request('/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_like', postId: post.id, liked: next }) });
      await selectionHaptic();
    } catch {
      setLiked(!next);
      setLikes((value) => Math.max(0, value + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }
  return <article className="post">
    <header><Avatar src={post.avatar} name={post.display_name} /><div><strong>{post.display_name}</strong><span>@{post.username} · {dateLabel(post.created_at)}</span></div><details className="row-menu"><summary aria-label="Opções da publicação"><CircleEllipsis size={22} aria-hidden="true" /></summary>{own ? <button type="button" onClick={() => setDeleteOpen(true)}><Trash2 size={17} aria-hidden="true" />Excluir</button> : <button type="button" onClick={() => setReport(true)}><ShieldAlert size={17} aria-hidden="true" />Denunciar</button>}</details></header>
    <p className="post-body">{post.body}</p>
    {post.image && <PrivateImage className="post-image" src={post.image} alt={`Foto publicada por ${post.display_name}`} />}
    {post.video && <div className="post-video-action"><Button type="button" variant="secondary" disabled={!online || videoBusy} onClick={async () => { setVideoBusy(true); setVideoError(''); try { await api.playVideo(post.video!); } catch (cause) { setVideoError(errorMessage(cause)); } finally { setVideoBusy(false); } }}><Play size={18} aria-hidden="true" />{videoBusy ? 'Abrindo vídeo…' : 'Reproduzir vídeo'}</Button><small>O vídeo abre no player seguro do iPhone.</small></div>}
    {videoError && <ErrorState message={videoError} />}
    <div className="post-context">{post.sport_name && <span>{post.sport_name}</span>}{post.arena_name && <span><MapPin size={14} aria-hidden="true" />{post.arena_name}</span>}{post.audience === 'private' && <span><LockKeyhole size={14} aria-hidden="true" />Grupo privado</span>}</div>
    <footer><button type="button" aria-label={liked ? 'Descurtir publicação' : 'Curtir publicação'} aria-pressed={liked} disabled={busy || !online} onClick={like}><Heart fill={liked ? 'currentColor' : 'none'} size={19} aria-hidden="true" />{likes}</button><CommentsAction postId={post.id} author={post.display_name} count={post.comment_count} online={online} onChanged={onChanged} /><RepostAction postId={post.id} author={post.display_name} audience={post.audience} canRepost={post.can_repost} reposted={post.reposted} online={online} onChanged={onChanged} /><button type="button" onClick={() => void sharePost(post.id, post.audience === 'private', mobileConfig.apiOrigin)}><Share2 size={19} aria-hidden="true" />Compartilhar</button></footer>
    <ReportDialog open={report} target="post" id={post.id} onClose={() => setReport(false)} onDone={() => { setReport(false); onChanged(); }} />
    <Modal open={deleteOpen} title="Excluir publicação" onClose={() => { if (!removing) setDeleteOpen(false); }}><Notice tone="warning">A publicação e seus comentários serão removidos de forma permanente. Um jogo privado usado para criar este retrato não será alterado.</Notice>{removeError && <ErrorState message={removeError} />}<div className="form-actions"><Button type="button" variant="quiet" disabled={removing} onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button type="button" variant="danger" disabled={!online || removing} onClick={async () => { setRemoving(true); setRemoveError(''); try { await api.request('/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_post', id: post.id }) }); await successHaptic(); setDeleteOpen(false); onChanged(); } catch (cause) { setRemoveError(errorMessage(cause)); } finally { setRemoving(false); } }}>{removing ? 'Excluindo…' : 'Excluir publicação'}</Button></div></Modal>
  </article>;
}

function ReportDialog({ open, target, id, onClose, onDone }: { open: boolean; target: 'player' | 'post' | 'comment'; id: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState<'spam' | 'harassment' | 'unsafe' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.request('/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'report', target, id, reason, details }) });
      await successHaptic(); onDone();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <Modal open={open} title="Denunciar conteúdo" onClose={onClose}><form onSubmit={submit}><p className="privacy-note">A equipe recebe a denúncia. O conteúdo não é removido automaticamente.</p><Field label="Motivo"><select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)}><option value="spam">Spam</option><option value="harassment">Assédio</option><option value="unsafe">Risco ou conteúdo inseguro</option><option value="other">Outro</option></select></Field><Field label="Detalhes (opcional)"><textarea rows={3} maxLength={500} value={details} onChange={(event) => setDetails(event.target.value)} /></Field>{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar denúncia'}</Button></div></form></Modal>;
}

export function PeopleScreen({ online, targetUsername, onClearTarget }: { online: boolean; targetUsername?: string; onClearTarget: () => void }) {
  if (targetUsername) return <PlayerDetail key={targetUsername} username={targetUsername} online={online} onBack={onClearTarget} />;
  return <PeopleDirectory online={online} />;
}

function PeopleDirectory({ online }: { online: boolean }) {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const result = useRemote<{ kind: 'discover'; players: Player[]; hasMore: boolean }>(query('/social', { resource: 'discover', search, offset: 0 }));
  return <section className="screen" aria-labelledby="people-title">
    <ScreenHeading id="people-title" eyebrow="ENCONTRE SUA TURMA" title="Pessoas" />
    <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSearch(draft.trim()); }}><Search size={19} aria-hidden="true" /><label><span className="sr-only">Buscar pessoas</span><input type="search" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={100} placeholder="Nome ou @usuário" autoCapitalize="none" /></label><Button type="submit" variant="quiet">Buscar</Button></form>
    {result.status === 'loading' && !result.data && <LoadingState>Buscando pessoas…</LoadingState>}
    {result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}
    {result.data?.players.length === 0 && <EmptyState title="Ninguém com esse nome.">Tente outro nome ou limpe a busca.</EmptyState>}
    <div className="people-list">{result.data?.players.map((player) => <PlayerRow key={player.id} player={player} online={online} onChanged={result.reload} />)}</div>
  </section>;
}

function PlayerDetail({ username, online, onBack }: { username: string; online: boolean; onBack: () => void }) {
  const result = useRemote<{ kind: 'player'; profile: Profile; own: boolean; connected: boolean }>(query('/social', { resource: 'player', username }));
  const profile = result.data?.profile;
  const player = profile && !result.data?.own ? {
    id: profile.id,
    username: profile.username,
    display_name: profile.name,
    bio: profile.bio,
    city: profile.city,
    neighborhood: profile.neighborhood,
    is_demo: profile.isDemo,
    sport_name: profile.sports[0]?.sport.name || null,
    sport_slug: profile.sports[0]?.sport.slug || null,
    level: profile.sports[0]?.level || null,
    connected: Boolean(result.data?.connected),
    avatar: profile.avatar,
  } satisfies Player : null;
  return <section className="screen" aria-labelledby="player-detail-title">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={19} aria-hidden="true" />Pessoas</button>
    <ScreenHeading id="player-detail-title" eyebrow="PERFIL" title={profile?.name || `@${username}`} />
    {result.status === 'loading' && !result.data && <LoadingState>Abrindo perfil…</LoadingState>}
    {result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}
    {profile && <div className="profile-details"><header className="profile-identity"><Avatar src={profile.avatar} name={profile.name} size="large" /><div><h2>{profile.name}</h2><p>@{profile.username}</p><span>{[profile.neighborhood, profile.city].filter(Boolean).join(', ')}</span></div></header>{profile.bio && <p className="profile-bio">{profile.bio}</p>}{result.data?.own ? <Notice>Este é o seu perfil.</Notice> : player && <PlayerRow player={player} online={online} onChanged={result.reload} />}<section><h3>Na areia</h3>{profile.sports.map((item) => <div className="sport-row" key={item.sport.id}><strong>{item.sport.name}</strong><span>{item.level}{item.isPrimary ? ' · principal' : ''}</span></div>)}</section></div>}
  </section>;
}

function PlayerRow({ player, online, onChanged }: { player: Player; online: boolean; onChanged: () => void }) {
  const [connected, setConnected] = useState(player.connected);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(false);
  const [message, setMessage] = useState('');
  async function connection() {
    setBusy(true); setMessage('');
    try {
      await api.request('/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_connection', playerId: player.id, connected: !connected }) });
      setConnected(!connected); await selectionHaptic();
    } catch (cause) { setMessage(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  async function block() {
    setBusy(true); setMessage('');
    try {
      await api.request('/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_block', playerId: player.id, blocked: true }) });
      await successHaptic(); onChanged();
    } catch (cause) { setMessage(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <article className="person-row"><Avatar src={player.avatar} name={player.display_name} /><div className="row-content"><strong>{player.display_name}</strong><span>@{player.username}</span>{(player.sport_name || player.neighborhood) && <p>{[player.sport_name, player.level, player.neighborhood].filter(Boolean).join(' · ')}</p>}{message && <small role="alert">{message}</small>}</div><div className="row-actions"><Button variant={connected ? 'secondary' : 'primary'} disabled={!online || busy} onClick={connection}>{connected ? <UserMinus size={17} aria-hidden="true" /> : <UserPlus size={17} aria-hidden="true" />}{connected ? 'Desconectar' : 'Conectar'}</Button><details className="row-menu"><summary aria-label={`Mais opções para ${player.display_name}`}><CircleEllipsis size={21} aria-hidden="true" /></summary><button type="button" onClick={() => setReport(true)}><ShieldAlert size={17} aria-hidden="true" />Denunciar</button><button type="button" onClick={block}><UserMinus size={17} aria-hidden="true" />Bloquear</button></details></div><ReportDialog open={report} target="player" id={player.id} onClose={() => setReport(false)} onDone={() => setReport(false)} /></article>;
}

type CommunityPage = Community & {
  readable: boolean;
  rules: string | null;
  sports: Sport[];
  members: { id: string; name: string; username: string; role: string; status: string }[];
};

export function CommunitiesScreen({ online, targetSlug, onClearTarget }: { online: boolean; targetSlug?: string; onClearTarget: () => void }) {
  if (targetSlug) return <CommunityDetail key={targetSlug} slug={targetSlug} online={online} onBack={onClearTarget} />;
  return <CommunityDirectory online={online} />;
}

function CommunityDirectory({ online }: { online: boolean }) {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(false);
  const result = useRemote<Community[]>(query('/communities', { search, mine, offset: 0 }));
  return <section className="screen" aria-labelledby="communities-title">
    <ScreenHeading id="communities-title" eyebrow="CONVERSA QUE CONTINUA" title="Comunidades" />
    <div className="segmented section-segmented"><button type="button" aria-pressed={mine} onClick={() => setMine(true)}>Minhas</button><button type="button" aria-pressed={!mine} onClick={() => setMine(false)}>Explorar</button></div>
    <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSearch(draft.trim()); }}><Search size={19} aria-hidden="true" /><label><span className="sr-only">Buscar comunidades</span><input type="search" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={100} placeholder="Nome da comunidade" /></label><Button type="submit" variant="quiet">Buscar</Button></form>
    {result.status === 'loading' && !result.data && <LoadingState>Carregando comunidades…</LoadingState>}
    {result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}
    {result.data?.length === 0 && <EmptyState title={search ? 'Nenhuma comunidade com esse nome.' : mine ? 'Você ainda não participa de grupos.' : 'Ainda sem comunidades por aqui.'}>{search ? 'Tente outro nome ou limpe a busca.' : mine ? 'Explore os grupos e encontre uma turma que combina com você.' : 'Quando uma comunidade for criada, ela aparece aqui.'}</EmptyState>}
    <div className="community-list">{result.data?.map((community) => <CommunityRow key={community.id} community={community} online={online} onChanged={result.reload} />)}</div>
  </section>;
}

function CommunityDetail({ slug, online, onBack }: { slug: string; online: boolean; onBack: () => void }) {
  const result = useRemote<CommunityPage | null>(query('/communities', { kind: 'page', slug }));
  return <section className="screen" aria-labelledby="community-detail-title">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={19} aria-hidden="true" />Comunidades</button>
    <ScreenHeading id="community-detail-title" eyebrow="COMUNIDADE" title={result.data?.name || 'Comunidade'} />
    {result.status === 'loading' && !result.data && <LoadingState>Abrindo comunidade…</LoadingState>}
    {result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}
    {result.status === 'ready' && !result.data && <EmptyState title="Comunidade indisponível.">Ela pode ter sido arquivada ou não estar disponível para sua conta.</EmptyState>}
    {result.data && <CommunityPageView community={result.data} online={online} onChanged={result.reload} />}
  </section>;
}

function CommunityPageView({ community, online, onChanged }: { community: CommunityPage; online: boolean; onChanged: () => void }) {
  const feed = useRemote<{ posts: Post[]; hasMore: boolean; viewerId: string }>(query('/posts', { community: community.id }));
  return <>
    <CommunityRow community={community} online={online} onChanged={onChanged} />
    {community.readable ? <>
      <details className="community-about"><summary>Sobre o grupo e participantes</summary><div><h2>Modalidades</h2><p>{community.sports.map((sport) => sport.name).join(' · ') || 'As modalidades ainda não foram informadas.'}</p><h2>Regras da comunidade</h2><p>{community.rules || 'As regras ainda não foram informadas.'}</p><h2>Participantes</h2><ul className="member-list">{community.members.filter((member) => member.status === 'active').map((member) => <li key={member.id}>{member.name}<span>@{member.username}</span></li>)}</ul></div></details>
      <section aria-labelledby="community-wall-title"><h2 id="community-wall-title">Mural</h2>{feed.status === 'loading' && !feed.data && <LoadingState>Buscando publicações…</LoadingState>}{feed.status === 'error' && <ErrorState message={feed.message} onRetry={feed.reload} />}{feed.data?.posts.length === 0 && <EmptyState title="O mural está tranquilo.">As publicações da comunidade aparecem aqui.</EmptyState>}<div className="feed-list">{feed.data?.posts.map((post) => <PostItem key={post.id} post={post} online={online} onChanged={feed.reload} />)}</div></section>
    </> : <Notice tone="warning">O conteúdo desta comunidade fica disponível somente para participantes autorizados.</Notice>}
  </>;
}

function CommunityRow({ community, online, onChanged }: { community: Community; online: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canJoin = community.entry_mode !== 'invite' || community.membership === 'active';
  async function membership() {
    setBusy(true); setMessage(''); setError('');
    try {
      const leaving = community.membership === 'active';
      await api.request('/communities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'membership', id: community.id, memberAction: leaving ? 'leave' : 'join' }) });
      setMessage(leaving ? 'Você saiu da comunidade.' : community.entry_mode === 'approval' ? 'Pedido enviado para análise.' : 'Você entrou na comunidade.');
      await successHaptic(); onChanged();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <article className="community-row"><span className="community-symbol"><UsersRound size={21} aria-hidden="true" /></span><div><div className="title-line"><h2>{community.name}</h2>{community.pico_official && <span className="official-tag">Pico</span>}</div>{community.description && <p>{community.description}</p>}<small>{community.visibility === 'private' ? 'Só participantes ativos' : 'Pessoas do Pico'} · {community.entry_mode === 'open' ? 'entrada aberta' : community.entry_mode === 'approval' ? 'entrada por aprovação' : 'por convite'}</small>{community.arena_name && <span className="community-arena"><MapPin size={14} aria-hidden="true" />{community.arena_name}{community.is_official ? ' · oficial' : ''}</span>}{message && <Notice tone="success">{message}</Notice>}{error && <ErrorState message={error} />}</div><div className="community-action">{community.membership === 'pending' ? <span className="pending-label">Em análise</span> : <Button variant={community.membership === 'active' ? 'quiet' : 'secondary'} disabled={!online || busy || !canJoin} onClick={membership}>{community.membership === 'active' ? 'Sair' : community.entry_mode === 'invite' ? 'Só convite' : community.entry_mode === 'approval' ? 'Pedir entrada' : 'Participar'}</Button>}</div></article>;
}

export function ArenasScreen({ targetSlug, onClearTarget }: { targetSlug?: string; onClearTarget: () => void }) {
  if (targetSlug) return <TargetArenaDetail key={targetSlug} slug={targetSlug} onBack={onClearTarget} />;
  return <ArenaDirectory />;
}

function TargetArenaDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const result = useRemote<{ kind: 'arena'; arena: Arena }>(query('/social', { resource: 'arena', slug }));
  return <section className="screen arena-detail">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={19} aria-hidden="true" />Arenas</button>
    {result.status === 'loading' && !result.data && <LoadingState>Abrindo arena…</LoadingState>}
    {result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}
    {result.data && <ArenaDetail arena={result.data.arena} />}
  </section>;
}

function ArenaDirectory() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Arena | null>(null);
  const result = useRemote<{ kind: 'arenas'; arenas: Arena[]; sports: Sport[]; hasMore: boolean }>(query('/social', { resource: 'arenas', search, offset: 0 }));
  if (selected) return <section className="screen arena-detail"><button type="button" className="back-button" onClick={() => setSelected(null)}><ArrowLeft size={19} aria-hidden="true" />Arenas</button><ArenaDetail arena={selected} /></section>;
  return <section className="screen" aria-labelledby="arenas-title"><ScreenHeading id="arenas-title" eyebrow="SEUS LUGARES" title="Arenas" /><form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSearch(draft.trim()); }}><Search size={19} aria-hidden="true" /><label><span className="sr-only">Buscar arenas</span><input type="search" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={100} placeholder="Nome, bairro ou cidade" /></label><Button type="submit" variant="quiet">Buscar</Button></form>{result.status === 'loading' && !result.data && <LoadingState>Buscando arenas…</LoadingState>}{result.status === 'error' && <ErrorState message={result.message} onRetry={result.reload} />}{result.data?.arenas.length === 0 && <EmptyState title="Nenhuma arena por aqui.">Tente outro nome ou limpe a busca.</EmptyState>}<div className="arena-list">{result.data?.arenas.map((arena) => <button type="button" className="arena-row" key={arena.id} onClick={() => setSelected(arena)}>{arena.image ? <PrivateImage src={arena.image} alt="" /> : <span className="arena-placeholder"><MapPin size={21} aria-hidden="true" /></span>}<span><strong>{arena.name}</strong><small>{arena.neighborhood}, {arena.city}</small><em>{arena.sports.map((sport) => sport.name).join(' · ')}</em></span><ChevronRight size={20} aria-hidden="true" /></button>)}</div></section>;
}

function ArenaDetail({ arena }: { arena: Arena }) {
  return <>{arena.image && <PrivateImage src={arena.image} alt={`Vista de ${arena.name}`} className="arena-cover" />}<span className="eyebrow">ARENA</span><h1>{arena.name}</h1><p className="arena-location"><MapPin size={18} aria-hidden="true" />{arena.neighborhood}, {arena.city}</p><p className="arena-description">{arena.description}</p><div className="sport-strip">{arena.sports.map((sport) => <span key={sport.id}>{sport.name}</span>)}</div>{arena.directory && <section className="arena-info"><h2>Como chegar</h2><p>{arena.directory.address}</p>{arena.directory.note && <p>{arena.directory.note}</p>}<small>Informações conferidas em {dateLabel(arena.directory.checkedOn)}.</small></section>}<Notice>O Pico não mostra presença ao vivo nem disponibilidade de pessoas.</Notice></>;
}

export function ProfileScreen({ profile, online, initialSection, onEditProfile, onSignedOut }: { profile: Profile; online: boolean; initialSection?: 'profile' | 'games' | 'account'; onEditProfile: () => void; onSignedOut: () => void }) {
  const [section, setSection] = useState<'profile' | 'games' | 'account'>(initialSection || 'profile');
  return <section className="screen profile-screen" aria-labelledby="profile-title">
    <ScreenHeading id="profile-title" eyebrow="SEU LUGAR NO PICO" title="Perfil" />
    <header className="profile-identity"><Avatar src={profile.avatar} name={profile.name} size="large" /><div><h2>{profile.name}</h2><p>@{profile.username}</p><span>{[profile.neighborhood, profile.city].filter(Boolean).join(', ')}</span></div></header>
    <div className="segmented section-segmented profile-sections"><button type="button" aria-pressed={section === 'profile'} onClick={() => setSection('profile')}>Perfil</button><button type="button" aria-pressed={section === 'games'} onClick={() => setSection('games')}>Jogos</button><button type="button" aria-pressed={section === 'account'} onClick={() => setSection('account')}>Conta</button></div>
    {section === 'profile' && <ProfileDetails profile={profile} onEdit={onEditProfile} />}
    {section === 'games' && <GamesPanel online={online} />}
    {section === 'account' && <AccountPanel online={online} onSignedOut={onSignedOut} />}
  </section>;
}

export function AccountRightsScreen({
  accessStatus,
  online,
  onBack,
  onSignedOut,
}: {
  accessStatus: 'active' | 'suspended' | 'revoked' | 'restricted';
  online: boolean;
  onBack?: () => void;
  onSignedOut: () => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const restricted = accessStatus !== 'active';
  const reason = accessStatus === 'suspended'
    ? 'O acesso social desta conta está suspenso. Seus controles de privacidade continuam disponíveis.'
    : accessStatus === 'revoked'
      ? 'O acesso social desta conta foi revogado. Seus controles de privacidade continuam disponíveis.'
      : restricted
        ? 'O conteúdo social está indisponível para esta conta. Seus controles de privacidade continuam disponíveis.'
        : 'Você pode concluir seu perfil depois. Os controles da conta já estão disponíveis.';

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await api.signOut(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  return <main className="screen account-panel account-rights" id="main-content">
    {onBack && <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={19} aria-hidden="true" />Voltar ao perfil</button>}
    <ScreenHeading id="account-rights-title" eyebrow="SUA CONTA" title={restricted ? 'Acesso e privacidade' : 'Conta e privacidade'} />
    <Notice tone={restricted ? 'warning' : undefined}>{reason}</Notice>
    <section className="account-group">
      <h2>Seus dados</h2>
      <button type="button" disabled={!online} onClick={() => setExportOpen(true)}><Download size={20} aria-hidden="true" /><span><strong>Exportar meus dados</strong><small>Gera uma cópia em JSON para salvar ou compartilhar.</small></span><ChevronRight size={19} aria-hidden="true" /></button>
      <button type="button" onClick={() => void openExternal(legalUrls.privacy)}><ShieldAlert size={20} aria-hidden="true" /><span><strong>Privacidade</strong><small>Como seus dados são usados e protegidos.</small></span><ChevronRight size={19} aria-hidden="true" /></button>
      <button type="button" onClick={() => void openExternal(legalUrls.support)}><MessageCircle size={20} aria-hidden="true" /><span><strong>Suporte</strong><small>Ajuda com acesso e uso do Pico.</small></span><ChevronRight size={19} aria-hidden="true" /></button>
    </section>
    <section className="account-group"><h2>Acesso</h2><button type="button" disabled={busy} onClick={() => void logout()}><ArrowLeft size={20} aria-hidden="true" /><span><strong>{busy ? 'Saindo…' : 'Sair desta conta'}</strong><small>A sessão segura será removida deste aparelho.</small></span></button></section>
    <section className="danger-zone"><h2>Excluir conta</h2><p>Remove sua identidade e seus dados da base ativa. Esta opção funciona mesmo sem acesso ao conteúdo social.</p><Button variant="danger" disabled={!online} onClick={() => setDeleteOpen(true)}><Trash2 size={18} aria-hidden="true" />Excluir minha conta</Button></section>
    {!online && <Notice tone="warning">Conecte-se para exportar dados ou excluir a conta.</Notice>}
    {error && <ErrorState message={error} />}
    <ExportDialog open={exportOpen} online={online} onClose={() => setExportOpen(false)} />
    <DeleteDialog open={deleteOpen} online={online} onClose={() => setDeleteOpen(false)} onDeleted={onSignedOut} />
  </main>;
}

function ProfileDetails({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return <div className="profile-details">{profile.bio ? <p className="profile-bio">{profile.bio}</p> : <p className="muted">Você ainda não escreveu uma apresentação.</p>}<section><h3>Na areia</h3>{profile.sports.map((item) => <div className="sport-row" key={item.sport.id}><strong>{item.sport.name}</strong><span>{item.level}{item.isPrimary ? ' · principal' : ''}</span></div>)}</section><Button variant="secondary" onClick={onEdit}>Editar perfil</Button></div>;
}

function GamesPanel({ online }: { online: boolean }) {
  const games = useRemote<PlayedGame[]>('/games?offset=0');
  const arenas = useRemote<{ kind: 'arenas'; arenas: Arena[]; sports: Sport[] }>(query('/social', { resource: 'arenas', offset: 0 }));
  const publicationOptions = useRemote<PublicationOptions>('/posts?kind=options');
  const [adding, setAdding] = useState(false);
  return <div className="games-panel"><header className="section-intro"><div><h2>Jogos guardados</h2><p>Só você vê estes registros. Compartilhar é uma ação separada.</p></div><Button onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" />Registrar</Button></header><GameForm open={adding} online={online} arenas={arenas.data?.arenas || []} onClose={() => setAdding(false)} onDone={() => { setAdding(false); games.reload(); }} />{games.status === 'loading' && !games.data && <LoadingState>Buscando seus jogos…</LoadingState>}{games.status === 'error' && <ErrorState message={games.message} onRetry={games.reload} />}{games.data?.length === 0 && <EmptyState title="Nenhum jogo guardado.">Depois da partida, registre o local, a modalidade e a data só para você.</EmptyState>}<div className="game-list">{games.data?.map((game) => <GameRow key={game.id} game={game} online={online} arenas={arenas.data?.arenas || []} options={publicationOptions.data} optionsError={publicationOptions.status === 'error' ? publicationOptions.message : ''} onDone={games.reload} />)}</div></div>;
}

function GameForm({ open, online, arenas, onClose, onDone }: { open: boolean; online: boolean; arenas: Arena[]; onClose: () => void; onDone: () => void }) {
  const accountId = api.user?.id || '';
  const draftRef = useRef<GameDraft | null>(null);
  const loadedAccount = useRef('');
  const [draft, setDraft] = useState<GameDraft>(newGameDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftError, setDraftError] = useState('');
  const { arenaId, sportId, playedOn } = draft;
  const arena = arenas.find((item) => item.id === arenaId);

  useEffect(() => {
    let active = true;
    if (!open || !accountId || loadedAccount.current === accountId) return;
    void drafts.loadGame(accountId).then((stored) => {
      if (!active) return;
      const next = stored || newGameDraft();
      draftRef.current = next;
      setDraft(next);
      setRestored(Boolean(stored));
      loadedAccount.current = accountId;
      setDraftReady(true);
    }).catch(() => {
      if (!active) return;
      const next = newGameDraft();
      draftRef.current = next;
      setDraft(next);
      loadedAccount.current = accountId;
      setDraftError('Não foi possível retomar o rascunho neste aparelho.');
      setDraftReady(true);
    });
    return () => { active = false; };
  }, [accountId, open]);

  function updateDraft(change: (current: GameDraft) => GameDraft) {
    if (!draftRef.current) return;
    const next = change(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setRestored(false);
    if (!accountId || !draftReady) return;
    void drafts.saveGame(accountId, next).catch(() => {
      setDraftError('Não foi possível guardar o rascunho neste aparelho.');
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!arenaId || !sportId || busy) return;
    const current = draftRef.current;
    if (!current) return;
    setBusy(true); setError('');
    try {
      await api.request('/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', id: current.idempotencyKey, arenaId: current.arenaId, sportId: current.sportId, playedOn: current.playedOn }) });
      const cleared = await drafts.confirmGame(accountId, current.idempotencyKey);
      if (!cleared) throw new Error('O jogo foi confirmado, mas o rascunho local ainda precisa ser limpo. Tente guardar novamente; ele não será duplicado.');
      const next = newGameDraft();
      draftRef.current = next;
      setDraft(next);
      setRestored(false);
      loadedAccount.current = '';
      setDraftReady(false);
      await successHaptic(); onDone();
    } catch (cause) { setError(`${errorMessage(cause)} Suas escolhas foram mantidas.`); }
    finally { setBusy(false); }
  }
  return <Modal open={open} title="Guardar um jogo" onClose={onClose}>{!draftReady ? <LoadingState>Retomando seu rascunho…</LoadingState> : <form onSubmit={submit}><Notice>Este registro é privado. Ele não informa presença ao vivo.</Notice>{restored && <Notice>Seu rascunho deste aparelho foi retomado.</Notice>}<Field label="Arena"><select required value={arenaId} onChange={(event) => updateDraft((current) => ({ ...current, arenaId: event.target.value, sportId: '' }))}><option value="" disabled>Escolha</option>{arenas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Modalidade"><select required value={sportId} onChange={(event) => updateDraft((current) => ({ ...current, sportId: event.target.value }))} disabled={!arena}><option value="" disabled>Escolha</option>{arena?.sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></Field><Field label="Data"><input type="date" required max={new Date().toISOString().slice(0, 10)} value={playedOn} onChange={(event) => updateDraft((current) => ({ ...current, playedOn: event.target.value }))} /></Field>{!online && <Notice tone="warning">Conecte-se para guardar. As escolhas continuam neste aparelho.</Notice>}{draftError && <ErrorState message={draftError} />}{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" onClick={onClose}>Continuar depois</Button><Button type="submit" disabled={!online || busy || !arenaId || !sportId}>{busy ? 'Guardando…' : 'Guardar só para mim'}</Button></div></form>}</Modal>;
}

function newGameDraft(): GameDraft {
  return { idempotencyKey: crypto.randomUUID(), arenaId: '', sportId: '', playedOn: new Date().toISOString().slice(0, 10) };
}

function GameRow({ game, online, arenas, options, optionsError, onDone }: { game: PlayedGame; online: boolean; arenas: Arena[]; options: PublicationOptions | null; optionsError: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  async function remove() {
    setBusy(true); setError('');
    try {
      await api.request('/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: game.id }) });
      await successHaptic(); onDone();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <article className="game-row"><span className="game-date"><strong>{new Date(`${game.played_on}T12:00:00`).getDate()}</strong><small>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${game.played_on}T12:00:00`))}</small></span><div><h3>{game.arena_name}</h3><p>{game.sport_name} · privado</p>{error && <small role="alert">{error}</small>}</div><div className="game-actions"><Button type="button" variant="quiet" disabled={!online || busy} onClick={() => setEditing(true)}>Editar</Button><Button type="button" variant="secondary" disabled={!online || busy || !options} onClick={() => setSharing(true)}><Share2 size={17} aria-hidden="true" />Compartilhar</Button><IconButton label="Excluir jogo" disabled={!online || busy} onClick={remove}>{busy ? <LoaderCircle className="spinner" size={19} aria-hidden="true" /> : <Trash2 size={19} aria-hidden="true" />}</IconButton></div><EditGameDialog open={editing} game={game} arenas={arenas} online={online} onClose={() => setEditing(false)} onDone={() => { setEditing(false); onDone(); }} /><GameShareDialog open={sharing} game={game} options={options} optionsError={optionsError} online={online} onClose={() => setSharing(false)} /></article>;
}

function EditGameDialog({ open, game, arenas, online, onClose, onDone }: { open: boolean; game: PlayedGame; arenas: Arena[]; online: boolean; onClose: () => void; onDone: () => void }) {
  const [arenaId, setArenaId] = useState(game.arena_id);
  const [sportId, setSportId] = useState(game.sport_id);
  const [playedOn, setPlayedOn] = useState(game.played_on);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const arena = arenas.find((item) => item.id === arenaId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!online || busy) return;
    setBusy(true); setError('');
    try {
      await api.request('/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', id: game.id, arenaId, sportId, playedOn, version: game.version }) });
      await successHaptic(); onDone();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <Modal open={open} title="Editar jogo" onClose={() => { if (!busy) onClose(); }}><form onSubmit={submit}><Notice>O registro continua privado. Uma publicação compartilhada antes não muda com esta edição.</Notice><Field label="Arena"><select value={arenaId} required onChange={(event) => { setArenaId(event.target.value); setSportId(''); }}><option value="" disabled>Escolha</option>{arenas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Modalidade"><select value={sportId} required disabled={!arena} onChange={(event) => setSportId(event.target.value)}><option value="" disabled>Escolha</option>{arena?.sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></Field><Field label="Data"><input type="date" required max={new Date().toISOString().slice(0, 10)} value={playedOn} onChange={(event) => setPlayedOn(event.target.value)} /></Field>{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!online || busy || !arenaId || !sportId}>{busy ? 'Salvando…' : 'Salvar jogo'}</Button></div></form></Modal>;
}

function GameShareDialog({ open, game, options, optionsError, online, onClose }: { open: boolean; game: PlayedGame; options: PublicationOptions | null; optionsError: string; online: boolean; onClose: () => void }) {
  const accountId = api.user?.id || '';
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'beta' | 'private'>('beta');
  const [wallArena, setWallArena] = useState(game.arena_id);
  const [groups, setGroups] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    let active = true;
    if (!open || !accountId) return;
    void attempts.loadGameShare(accountId, game.id, game.version).then((stored) => {
      if (!active) return;
      if (stored) {
        setKey(stored.key);
        setBody(stored.body);
        setAudience(stored.audience);
        setWallArena(stored.wallArena);
        setGroups(stored.groups);
        setRestored(true);
      } else {
        setRestored(false);
      }
      setReady(true);
    }).catch(() => {
      if (!active) return;
      setError('Não foi possível retomar a tentativa anterior neste aparelho.');
      setReady(true);
    });
    return () => { active = false; };
  }, [accountId, game.id, game.version, open]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accountId || !ready || !online || busy || !options || (audience === 'private' && groups.length !== 1)) return;
    setBusy(true); setError('');
    try {
      await attempts.saveGameShare(accountId, { key, gameId: game.id, gameVersion: game.version, body: body.trim(), audience, wallArena: audience === 'beta' ? wallArena : '', groups });
      await api.request('/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'share', id: game.id, version: game.version, key, body: body.trim(), imagePath: null, videoPath: null, audience, wallArena: audience === 'beta' ? wallArena || null : null, groups }) });
      const cleared = await attempts.confirmGameShare(accountId, key);
      if (!cleared) throw new Error('O compartilhamento foi confirmado, mas a tentativa local ainda precisa ser limpa. Tente novamente; a publicação não será duplicada.');
      setKey(crypto.randomUUID()); setRestored(false); setDone(true); await successHaptic();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <Modal open={open} title="Compartilhar jogo" onClose={() => { if (!busy) onClose(); }}>{!ready ? <LoadingState>Retomando a tentativa…</LoadingState> : done ? <><Notice tone="success">O jogo foi compartilhado como uma publicação separada. O registro privado continua só seu.</Notice><Button type="button" onClick={() => { setDone(false); setBody(''); onClose(); }}>Concluir</Button></> : <form onSubmit={submit}>{restored && <Notice>Uma tentativa ainda não confirmada neste aparelho foi retomada sem criar outra publicação.</Notice>}<Notice>Esta ação cria um retrato da data, arena e modalidade. Editar ou excluir o jogo depois não muda a publicação.</Notice><Field label="Legenda (opcional)"><textarea value={body} maxLength={500} rows={3} onChange={(event) => setBody(event.target.value)} placeholder="Como foi o jogo?" /></Field><Field label="Audiência"><select value={audience} onChange={(event) => { const next = event.target.value as 'beta' | 'private'; setAudience(next); setGroups([]); }}><option value="beta">Pessoas do Pico</option><option value="private">Participantes de um grupo privado</option></select></Field>{audience === 'beta' && <Field label="Mural de arena (opcional)"><select value={wallArena} onChange={(event) => setWallArena(event.target.value)}><option value="">Só no meu perfil</option>{options?.arenas.map((arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}</select></Field>}<fieldset className="choice-field"><legend>{audience === 'private' ? 'Grupo privado' : 'Comunidades (até 5)'}</legend>{options?.communities.filter((community) => community.visibility === audience).map((community) => <label key={community.id}><input type={audience === 'private' ? 'radio' : 'checkbox'} name="game-share-group" checked={groups.includes(community.id)} onChange={() => setGroups((current) => audience === 'private' ? [community.id] : current.includes(community.id) ? current.filter((id) => id !== community.id) : current.length < 5 ? [...current, community.id] : current)} />{community.name}</label>)}</fieldset>{audience === 'private' && groups.length !== 1 && <Notice tone="warning">Escolha um grupo privado.</Notice>}{!online && <Notice tone="warning">Conecte-se para compartilhar.</Notice>}{optionsError && <ErrorState message={optionsError} />}{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!online || busy || !options || (audience === 'private' && groups.length !== 1)}>{busy ? 'Compartilhando…' : 'Compartilhar como publicação'}</Button></div></form>}</Modal>;
}

function AccountPanel({ online, onSignedOut }: { online: boolean; onSignedOut: () => void }) {
  const account = useRemote<{ kind: 'account' } & AccountData>(query('/social', { resource: 'account' }));
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try { await api.signOut(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <div className="account-panel"><section className="account-group"><h2>Privacidade e segurança</h2><button type="button" onClick={() => setExportOpen(true)}><Download size={20} aria-hidden="true" /><span><strong>Exportar meus dados</strong><small>Gera uma cópia em JSON para salvar ou compartilhar.</small></span><ChevronRight size={19} aria-hidden="true" /></button><button type="button" onClick={() => void openExternal(legalUrls.privacy)}><ShieldAlert size={20} aria-hidden="true" /><span><strong>Privacidade</strong><small>Como seus dados são usados e protegidos.</small></span><ChevronRight size={19} aria-hidden="true" /></button><button type="button" onClick={() => void openExternal(legalUrls.guidelines)}><UsersRound size={20} aria-hidden="true" /><span><strong>Diretrizes da comunidade</strong><small>Convivência, denúncias e moderação.</small></span><ChevronRight size={19} aria-hidden="true" /></button></section>{account.status === 'loading' && !account.data && <LoadingState>Conferindo sua conta…</LoadingState>}{account.status === 'error' && <ErrorState message={account.message} onRetry={account.reload} />}{account.data?.deletionPending && <Notice tone="warning">A exclusão desta conta está em processamento.</Notice>}{account.data && <><BlockedPlayers blocks={account.data.blocks} online={online} onChanged={account.reload} /><ReportsPanel reports={account.data.reports} /><AccountMedia media={account.data.media} online={online} onChanged={account.reload} /></>}<section className="account-group"><h2>Acesso</h2><button type="button" onClick={() => void openExternal(legalUrls.support)}><MessageCircle size={20} aria-hidden="true" /><span><strong>Suporte</strong><small>Ajuda com acesso e uso do Pico.</small></span><ChevronRight size={19} aria-hidden="true" /></button><button type="button" disabled={busy} onClick={logout}><ArrowLeft size={20} aria-hidden="true" /><span><strong>{busy ? 'Saindo…' : 'Sair desta conta'}</strong><small>A sessão segura será removida deste aparelho.</small></span></button></section><section className="danger-zone"><h2>Excluir conta</h2><p>Remove sua identidade e seus dados da base ativa. Leia os detalhes antes de confirmar.</p><Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 size={18} aria-hidden="true" />Excluir minha conta</Button></section>{error && <ErrorState message={error} />}<ExportDialog open={exportOpen} online={online} onClose={() => setExportOpen(false)} /><DeleteDialog open={deleteOpen} online={online} onClose={() => setDeleteOpen(false)} onDeleted={onSignedOut} /></div>;
}

function BlockedPlayers({ blocks, online, onChanged }: { blocks: AccountData['blocks']; online: boolean; onChanged: () => void }) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  return <section className="blocked-players"><h2>Pessoas bloqueadas</h2><p>O bloqueio vale nos dois sentidos. Desbloquear não refaz conexões.</p>{blocks.length === 0 && <span className="muted">Você não bloqueou ninguém.</span>}{blocks.map((blocked) => <div key={blocked.blocked_id}><span>{blocked.blocked_name}</span><Button type="button" variant="quiet" disabled={!online || Boolean(busyId)} onClick={async () => { setBusyId(blocked.blocked_id); setError(''); try { await api.request('/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_block', playerId: blocked.blocked_id, blocked: false }) }); await successHaptic(); onChanged(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusyId(''); } }}>{busyId === blocked.blocked_id ? 'Desbloqueando…' : 'Desbloquear'}</Button></div>)}{error && <ErrorState message={error} />}</section>;
}

function ReportsPanel({ reports }: { reports: AccountData['reports'] }) {
  const reason = { spam: 'Spam', harassment: 'Assédio ou ofensa', unsafe: 'Conteúdo inseguro', other: 'Outro motivo' } as Record<string, string>;
  const status = { pending: 'Aguardando análise', action_taken: 'Medida aplicada', dismissed: 'Análise concluída' } as Record<string, string>;
  return <section className="account-list"><h2>Suas denúncias</h2><p>As 20 mais recentes. Sua identidade não é mostrada à pessoa denunciada.</p>{reports.length === 0 && <span className="muted">Nenhuma denúncia registrada.</span>}{reports.map((report) => <div key={report.id}><span><strong>{reason[report.reason] || 'Denúncia'}</strong><small>{new Date(report.created_at).toLocaleDateString('pt-BR')}</small></span><span>{status[report.status] || 'Em análise'}</span></div>)}</section>;
}

function AccountMedia({ media, online, onChanged }: { media: AccountData['media']; online: boolean; onChanged: () => void }) {
  const [removing, setRemoving] = useState('');
  const [error, setError] = useState('');
  async function remove(item: AccountData['media'][number]) {
    if (!online || item.inUse || removing) return;
    setRemoving(item.path);
    setError('');
    try {
      if (item.bucket === 'post-videos') await removeMobileVideo(item.path);
      else await api.request('/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket: item.bucket, path: item.path }) });
      await successHaptic();
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setRemoving('');
    }
  }
  return <section className="account-list"><h2>Suas fotos e vídeos</h2><p>Mídia ainda não publicada fica privada. Remova arquivos sem uso para liberar espaço.</p>{media.length === 0 && <span className="muted">Nenhum arquivo enviado.</span>}{media.map((item, index) => <div key={item.path}><span><strong>{item.bucket === 'avatars' ? 'Foto de perfil' : item.bucket === 'post-videos' ? 'Vídeo de publicação' : 'Foto de publicação'} {index + 1}</strong><small>{item.inUse ? 'Em uso' : item.ready ? 'Sem uso' : 'Envio incompleto'}</small></span>{!item.inUse && <Button type="button" variant="quiet" disabled={!online || Boolean(removing)} onClick={() => void remove(item)}>{removing === item.path ? 'Removendo…' : 'Remover'}</Button>}</div>)}{error && <ErrorState message={error} />}</section>;
}

function ExportDialog({ open, online, onClose }: { open: boolean; online: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const password = String(new FormData(event.currentTarget).get('password') || '');
      const data = await api.request<unknown>('/account/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      await shareExport(data); await successHaptic(); onClose();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <Modal open={open} title="Exportar meus dados" onClose={onClose}><form onSubmit={submit}><p>Confirme sua senha. O app prepara uma cópia em texto JSON e abre as opções seguras do iPhone para você salvar ou compartilhar.</p><Field label="Senha"><input name="password" required type="password" autoComplete="current-password" /></Field>{!online && <Notice tone="warning">Conecte-se para preparar a cópia.</Notice>}{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!online || busy}>{busy ? 'Preparando…' : 'Gerar cópia JSON'}</Button></div></form></Modal>;
}

function DeleteDialog({ open, online, onClose, onDeleted }: { open: boolean; online: boolean; onClose: () => void; onDeleted: () => void }) {
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (confirmation !== 'EXCLUIR') return;
    setBusy(true); setError('');
    try {
      const password = String(new FormData(event.currentTarget).get('password') || '');
      await api.markDeletionIntent();
      await api.request('/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, confirmation }) });
      await api.wipe(true); onDeleted();
    } catch (cause) {
      if (cause instanceof PicoApiError && cause.status >= 400 && cause.status < 500) {
        await api.clearDeletionIntent().catch(() => undefined);
      }
      setError(errorMessage(cause));
    }
    finally { setBusy(false); }
  }
  return <Modal open={open} title="Excluir minha conta" onClose={onClose}><form onSubmit={submit}><Notice tone="warning">Esta ação remove sua identidade, fotos pessoais, jogos e dados sociais da base ativa. Arenas e comunidades podem permanecer com custódia transferida.</Notice><Field label="Senha"><input name="password" required type="password" autoComplete="current-password" /></Field><Field label="Digite EXCLUIR para confirmar"><input value={confirmation} onChange={(event) => setConfirmation(event.target.value.toLocaleUpperCase('pt-BR'))} autoCapitalize="characters" autoCorrect="off" /></Field>{!online && <Notice tone="warning">Conecte-se para excluir a conta.</Notice>}{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" onClick={onClose}>Voltar</Button><Button type="submit" variant="danger" disabled={!online || busy || confirmation !== 'EXCLUIR'}>{busy ? 'Excluindo…' : 'Excluir de forma permanente'}</Button></div></form></Modal>;
}

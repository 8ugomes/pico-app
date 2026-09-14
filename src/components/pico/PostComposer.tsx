'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ImageIcon, PenLine, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { findMentionQuery, insertMention } from '@/lib/inline-mentions';
import { useDemo } from './DemoProvider';
import { PlayerAvatar } from './PlayerAvatar';
import { validatePost } from '@/lib/demo-state';
import { formatGameDate } from '@/lib/game-date';
import type { SportId } from '@/types/social';
import type { PlayedGame } from '@/types/games';

export function PostComposer({ fixedArenaId, fixedCommunityId, game, initiallyOpen = false }: { fixedArenaId?: string; fixedCommunityId?: string; game?: PlayedGame; initiallyOpen?: boolean }) {
  const { state, dispatch, now, me } = useDemo();
  const initialCommunity = state.communities.find(item => item.id === fixedCommunityId);
  const [open, setOpen] = useState(initiallyOpen);
  const [arenaId, setArenaId] = useState(game?.arena_id ?? fixedArenaId ?? initialCommunity?.arenaId ?? state.arenas[0].id);
  const arena = state.arenas.find(item => item.id === arenaId)!;
  const [sportId, setSportId] = useState<SportId>(game?.sport_slug ?? arena.sports[0]);
  const [content, setContent] = useState(''), [caret, setCaret] = useState(0), [error, setError] = useState(''), [published, setPublished] = useState<string | null>(null);
  const [audience, setAudience] = useState<'beta' | 'private'>(initialCommunity?.visibility ?? 'beta');
  const [groups, setGroups] = useState<string[]>(initialCommunity ? [initialCommunity.id] : []);
  const [wall, setWall] = useState(Boolean(fixedArenaId && state.followedArenaIds.includes(fixedArenaId)));
  const [photo, setPhoto] = useState(false);
  const attempt = useRef<string | null>(null), textarea = useRef<HTMLTextAreaElement>(null);
  const query = !game ? findMentionQuery(content, caret) : null;
  const mentionGroup = groups[0];
  const candidates = state.players.filter(person => person.id !== me.id && state.communities.find(group => group.id === mentionGroup)?.members.includes(person.id) && (person.name.toLocaleLowerCase('pt-BR').includes(query?.query.toLocaleLowerCase('pt-BR') ?? '') || person.username.includes(query?.query.toLocaleLowerCase('pt-BR') ?? '')));
  const destinations = groups.map(id => state.communities.find(group => group.id === id)?.name).filter(Boolean);
  useEffect(() => { if (open && !game) textarea.current?.focus({ preventScroll: true }); }, [open, game]);
  useEffect(() => { if (textarea.current) { textarea.current.style.height = 'auto'; textarea.current.style.height = `${textarea.current.scrollHeight}px`; } }, [content]);

  function choose(handle: string) {
    if (!query) return;
    const next = insertMention(content, query, handle);
    setContent(next.body); setCaret(next.cursor);
    requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(next.cursor, next.cursor); });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const input = { arenaId, sportId, content, audience, communityIds: groups, distributedToArena: wall, ...(game ? { gameId: game.id, gameVersion: game.version } : {}) };
    const invalid = validatePost(state, input);
    if (invalid) { setError(invalid); return; }
    attempt.current ??= crypto.randomUUID();
    dispatch({ type: 'post', input: { ...input, ...(photo ? { photo: '/images/urban-court.webp' } : {}) }, id: attempt.current, now });
    setPublished(attempt.current); attempt.current = null; setContent(''); setError(''); setOpen(false);
  }
  const editor = <form onSubmit={submit} className="connected-form compose-form">
    {game && <div className="compose-game-context"><strong>{game.arena_name}</strong><span>{game.sport_name} · Jogado em {formatGameDate(game.played_on)}</span><small>Seu registro continua privado.</small></div>}
    <label className="sr-only" htmlFor={`demo-publication-${game?.id || fixedCommunityId || fixedArenaId || 'feed'}`}>Texto da publicação de demonstração</label>
    <textarea id={`demo-publication-${game?.id || fixedCommunityId || fixedArenaId || 'feed'}`} ref={textarea} data-dialog-autofocus className="compose-text" value={content} onChange={event => { setContent(event.target.value); setCaret(event.target.selectionStart); }} onClick={event => setCaret(event.currentTarget.selectionStart)} onKeyUp={event => setCaret(event.currentTarget.selectionStart)} maxLength={500} rows={3} placeholder={game ? 'Como foi o jogo? Você pode deixar em branco.' : 'O que aconteceu na areia? Digite @ para marcar.'} />
    {query && <div className="mention-popover" aria-label="Sugestões de menção da demonstração">{!groups.length ? <><p>Escolha uma comunidade:</p><div className="mention-community-options">{state.communities.filter(group => group.visibility === audience && group.members.includes(me.id)).map(group => <button type="button" key={group.id} onClick={() => setGroups([group.id])}>{group.name}</button>)}</div></> : <><div className="mention-popover-heading"><span>Na comunidade</span><strong>{state.communities.find(group => group.id === mentionGroup)?.name}</strong></div><div className="mention-results">{'todos'.startsWith(query.query.toLocaleLowerCase('pt-BR')) && <button type="button" onClick={() => choose('todos')}><strong>@todos</strong><span>Somente texto nesta demonstração</span></button>}{candidates.map(person => <button type="button" key={person.id} onClick={() => choose(person.username)}><strong>{person.name}</strong><span>@{person.username}</span></button>)}</div></>}</div>}
    <div className="compose-toolbar"><button type="button" className="compose-tool-label" aria-pressed={photo} onClick={() => setPhoto(value => !value)}><span className="compose-tool"><ImageIcon size={19} aria-hidden="true" />{photo ? 'Imagem ilustrativa adicionada' : 'Imagem ilustrativa'}</span></button><span className="compose-count">{content.length}/500</span></div>
    <details className="compose-settings"><summary>{audience === 'private' ? 'Só participantes do grupo' : 'Pessoas do Pico'}{destinations.length ? ` · ${destinations.join(' · ')}` : ' · seu perfil'} <span>Alterar</span></summary><div className="compose-settings-body">
      <label className="input-group">Quem pode ver<select className="input" value={audience} onChange={event => { setAudience(event.target.value as 'beta' | 'private'); setGroups([]); setWall(false); }}><option value="beta">Pessoas do Pico · simulação</option><option value="private">Grupo privado · simulação</option></select></label>
      {audience === 'beta' && state.followedArenaIds.includes(arenaId) && <div className="compose-destinations"><span>Mural da arena</span><div><button type="button" aria-pressed={wall} onClick={() => setWall(value => !value)}>{arena.name}</button></div></div>}
      <div className="compose-destinations"><span>Comunidades</span><div>{state.communities.filter(group => group.visibility === audience && group.members.includes(me.id)).map(group => <button type="button" key={group.id} aria-pressed={groups.includes(group.id)} onClick={() => setGroups(groups.includes(group.id) ? groups.filter(id => id !== group.id) : audience === 'private' ? [group.id] : [...groups, group.id])}>{group.name}</button>)}</div></div>
      {!game && <details className="compose-optional"><summary>Marcar local e modalidade</summary><div className="form-columns"><label className="input-group">Local<select className="input" value={arenaId} disabled={Boolean(fixedArenaId)} onChange={event => { const next = state.arenas.find(item => item.id === event.target.value)!; setArenaId(next.id); setSportId(next.sports[0]); setWall(false); }}>{state.arenas.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="input-group">Modalidade<select className="input" value={sportId} onChange={event => setSportId(event.target.value as SportId)}>{arena.sports.map(id => <option key={id} value={id}>{state.sports.find(item => item.id === id)?.name}</option>)}</select></label></div></details>}
      <p className="compose-privacy-note">{audience === 'private' ? 'Só participantes do grupo escolhido veriam.' : 'Pessoas do Pico veriam.'} Esta publicação fica somente nesta sessão.</p>
    </div></details>
    {query && <p className="compose-privacy-note">Menções nesta demonstração ficam só no texto e não enviam avisos.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="compose-actions"><Button type="button" variant="quiet" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={(!content.trim() && !game) || (audience === 'private' && groups.length !== 1)}>Publicar nesta demonstração</Button></div>
  </form>;
  return <>
    {game ? <><Button variant="secondary" size="small" onClick={() => setOpen(true)}><Share2 size={16} aria-hidden="true" />Compartilhar jogo</Button><Modal open={open} onClose={() => setOpen(false)} title="Compartilhar jogo">{editor}</Modal></>
      : <div className="publication-composer">{open ? editor : <button data-tour="publish" type="button" className="composer-trigger" onClick={() => { setPublished(null); setOpen(true); }}><PlayerAvatar player={me} size="small" /><span>O que aconteceu na areia?</span><PenLine size={20} aria-hidden="true" /></button>}</div>}
    {published && <p className="inline-success" role="status">Publicado somente nesta demonstração. <Link className="journey-text-link" href={`/publicacoes/${published}`}>Ver publicação</Link></p>}
  </>;
}

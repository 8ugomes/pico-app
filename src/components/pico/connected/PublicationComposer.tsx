'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, PenLine, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { findMentionQuery, insertMention, selectedMentionsInText, type MentionQuery } from '@/lib/inline-mentions';
import type { ReadArena } from '@/types/read';
import type { PublicationOptions } from '@/types/posts';
import type { PlayedGame } from '@/types/games';
import { formatGameDate } from '@/lib/game-date';
import { ArenaSelect } from './ArenaSelect';
import { PhotoUpload } from './Media';
import { entityAction, useEntity } from './useEntity';
import { useRemoteRead } from './useRemoteRead';

type Person = { id: string; name: string; username: string };

export function PublicationComposer({ viewerId, arenaId, communityId, onDone }: { viewerId: string; arenaId?: string; communityId?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return <div className="publication-composer">
    {open ? <PublicationDraft key={`${viewerId}:${arenaId || ''}:${communityId || ''}`} arenaId={arenaId} communityId={communityId} onBusy={setBusy} onCancel={() => { if (!busy) { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); } }} onDone={id => { setPublished(id); setOpen(false); onDone(); }} />
      : <button ref={trigger} data-tour="publish" type="button" className="composer-trigger" onClick={() => { setPublished(null); setOpen(true); }}><span className="composer-symbol"><PenLine size={20} aria-hidden="true" /></span><span>O que aconteceu na areia?</span></button>}
    {published && <p className="inline-success" role="status">Publicado. <Link className="journey-text-link" href={`/publicacoes/${published}`}>Ver publicação <ArrowUpRight size={16} aria-hidden="true" /></Link></p>}
  </div>;
}

export function PublicationDraft({ arenaId, communityId, game, onDone, onBusy, onCancel }: { arenaId?: string; communityId?: string; game?: PlayedGame; onDone: (id: string) => void; onBusy: (busy: boolean) => void; onCancel?: () => void }) {
  const { data, error, reload } = useEntity<PublicationOptions>('/api/posts?kind=options');
  return <Composer options={data} optionsError={error} reloadOptions={reload} arenaId={arenaId} communityId={communityId} game={game} onDone={onDone} onBusy={onBusy} onCancel={onCancel} />;
}

function Composer({ options, optionsError, reloadOptions, arenaId, communityId, game, onDone, onBusy, onCancel }: { options: PublicationOptions | null; optionsError: string; reloadOptions: () => void; arenaId?: string; communityId?: string; game?: PlayedGame; onDone: (id: string) => void; onBusy: (busy: boolean) => void; onCancel?: () => void }) {
  const [body, setBody] = useState(''), [caret, setCaret] = useState(0), [photo, setPhoto] = useState<string | null>(null);
  const [audienceChoice, setAudience] = useState<'beta' | 'private' | null>(null), [wallChoice, setWall] = useState<string | null>(null), [groupChoice, setGroups] = useState<string[] | null>(null);
  const [mentionCommunity, setMentionCommunity] = useState(''), [mentionPeople, setMentionPeople] = useState<Person[]>([]), [mentionEveryone, setMentionEveryone] = useState(false);
  const [marked, setMarked] = useState<ReadArena | null>(null), [sport, setSport] = useState('');
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [message, setMessage] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null), suggestions = useRef<HTMLDivElement>(null);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const { state: sportState } = useRemoteRead('resource=sports', !game);
  useEffect(() => {
    textarea.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (textarea.current) { textarea.current.style.height = 'auto'; textarea.current.style.height = `${textarea.current.scrollHeight}px`; }
  }, [body]);
  const initial = options?.communities.find(item => item.id === communityId);
  const audience = audienceChoice ?? initial?.visibility ?? 'beta';
  const groups = groupChoice ?? (initial ? [initial.id] : []);
  const wall = wallChoice ?? (options?.arenas.some(item => item.id === arenaId) ? arenaId || '' : '');
  const sports = marked ? marked.sports : sportState.status === 'success' && sportState.data.kind === 'sports' ? sportState.data.sports : [];
  const destinationNames = [options?.arenas.find(item => item.id === wall)?.name, ...(options?.communities.filter(item => groups.includes(item.id)).map(item => item.name) || [])].filter(Boolean);
  const mentionGroup = groups.includes(mentionCommunity) ? mentionCommunity : groups[0] || '';
  const active = selectedMentionsInText(body, mentionPeople, mentionEveryone);
  const query = !game ? findMentionQuery(body, caret) : null;
  const canPublish = Boolean(options) && !busy && !uploading && (Boolean(game) || Boolean(body.trim())) && body.trim().length <= 500 && groups.length <= 5 && (audience !== 'private' || groups.length === 1);
  function clearMentions() { setMentionPeople([]); setMentionEveryone(false); }
  function chooseMention(handle: string, person?: Person) {
    if (!query) return;
    const next = insertMention(body, query, handle);
    if (next.body.length > 500) { setMessage('O texto passou de 500 caracteres.'); return; }
    setBody(next.body); setCaret(next.cursor); setMessage('');
    if (person) setMentionPeople(previous => previous.some(item => item.id === person.id) ? previous : [...previous, person]);
    else setMentionEveryone(true);
    requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(next.cursor, next.cursor); });
  }

  return <form className="connected-form compose-form" onSubmit={async event => {
    event.preventDefault(); if (!canPublish) return;
    const common = { body, imagePath: photo, audience, wallArena: wall || undefined, groups };
    const mentions = { mentionCommunity: active.everyone || active.people.length ? mentionGroup : undefined, mentionPeople: active.people.map(person => person.id), mentionEveryone: active.everyone };
    const payload = game ? { ...common, id: game.id, version: game.version } : { ...common, ...mentions, action: 'publish', arena: marked?.id, sport: sport || undefined };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    setBusy(true); onBusy(true); setMessage('');
    try {
      const id: unknown = await entityAction(game ? '/api/games/share' : '/api/posts', { ...payload, key: attempt.current.key });
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('A confirmação da publicação não chegou. Confira antes de tentar novamente.');
      setBody(''); setPhoto(null); attempt.current = null; onDone(id);
    } catch (error) { setMessage((error instanceof Error ? error.message : 'Não foi possível confirmar.') + ' Seu rascunho foi mantido.'); }
    finally { setBusy(false); onBusy(false); }
  }}>
    {!game && <div className="compose-heading"><span>Nova publicação</span>{onCancel && <button type="button" className="compose-close" aria-label="Fechar editor" disabled={busy || uploading} onClick={onCancel}><X size={19} aria-hidden="true" /></button>}</div>}
    {game && <div className="compose-game-context"><strong>{game.arena_name}</strong><span>{game.sport_name} · Jogado em {formatGameDate(game.played_on)}</span><small>Seu registro continua privado.</small></div>}
    <label className="sr-only" htmlFor="publication-text">{game ? 'Conte como foi o jogo' : 'Texto da publicação'}</label>
    <textarea id="publication-text" ref={textarea} data-dialog-autofocus className="compose-text" value={body} onChange={event => { setBody(event.target.value); setCaret(event.target.selectionStart); }} onClick={event => setCaret(event.currentTarget.selectionStart)} onKeyUp={event => setCaret(event.currentTarget.selectionStart)} onKeyDown={event => { if (event.key === 'ArrowDown' && query && suggestions.current) { const first = suggestions.current.querySelector<HTMLButtonElement>('button:not(:disabled)'); if (first) { event.preventDefault(); first.focus(); } } }} maxLength={500} rows={3} placeholder={game ? 'Como foi o jogo? Você pode deixar em branco.' : 'O que aconteceu na areia?'} />
    {query && <div className="mention-popover" ref={suggestions} aria-label="Sugestões de menção">
      {!groups.length ? <><p>Escolha a comunidade para marcar alguém:</p><div className="mention-community-options">{options?.communities.filter(item => item.visibility === audience).map(item => <button type="button" key={item.id} onClick={() => { setGroups([item.id]); setMentionCommunity(item.id); }}>{item.name}</button>)}{options && !options.communities.some(item => item.visibility === audience) && <p>Você ainda não participa de uma comunidade aqui.</p>}</div></>
        : <><div className="mention-popover-heading"><span>Na comunidade</span>{groups.length > 1 ? <select aria-label="Comunidade da menção" value={mentionGroup} onChange={event => { setMentionCommunity(event.target.value); clearMentions(); }}>{options?.communities.filter(item => groups.includes(item.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <strong>{options?.communities.find(item => item.id === mentionGroup)?.name}</strong>}</div><MentionSuggestions communityId={mentionGroup} query={query} selectedCount={active.people.length} everyoneActive={active.everyone} onChoose={chooseMention} /></>}
    </div>}
    {(active.everyone || active.people.length > 0) && <p className="compose-mention-confirmation" role="status">{active.everyone ? `@todos avisa participantes ativos de ${options?.communities.find(item => item.id === mentionGroup)?.name}.` : `Aviso para ${active.people.map(person => '@' + person.username).join(', ')}.`}</p>}
    {!query && /(?:^|[\s([{])@[\p{L}\p{N}_.-]+/u.test(body) && !active.everyone && active.people.length === 0 && <p className="compose-privacy-note">Para avisar alguém, escolha a pessoa na lista ao digitar @.</p>}
    <details className="compose-settings"><summary><span className="compose-settings-label">{audience === 'private' ? 'Só participantes do grupo' : 'Pessoas do Pico'}{destinationNames.length ? ` · ${destinationNames.join(' · ')}` : ' · seu perfil'}</span><span className="compose-settings-action">Alterar <ChevronDown size={16} aria-hidden="true" /></span></summary>
      <div className="compose-settings-body">
        <label className="input-group">Quem pode ver<select className="input" value={audience} onChange={event => { const next = event.target.value as 'beta' | 'private'; setAudience(next); setGroups([]); setMentionCommunity(''); clearMentions(); if (next === 'private') setWall(''); }}><option value="beta">Pessoas do Pico</option><option value="private">Participantes de uma comunidade privada</option></select></label>
        {audience === 'beta' && <WallArenaPicker arenas={options?.arenas ?? []} value={wall} onChange={setWall} />}
        <div className="compose-destinations"><span>{audience === 'private' ? 'Grupo privado' : 'Comunidades'}</span><div>{options?.communities.filter(item => item.visibility === audience).map(item => <button type="button" key={item.id} aria-pressed={groups.includes(item.id)} disabled={!groups.includes(item.id) && groups.length >= 5} onClick={() => { const next = groups.includes(item.id) ? groups.filter(id => id !== item.id) : audience === 'private' ? [item.id] : [...groups, item.id]; setGroups(next); setMentionCommunity(next[0] || ''); clearMentions(); }}>{item.name}</button>)}</div>{options && !options.communities.some(item => item.visibility === audience) && <small>Você ainda não participa de uma comunidade com esta audiência.</small>}</div>
        {!game && <details className="compose-optional"><summary>Marcar local e modalidade</summary><p>Marcar um lugar não publica no mural da arena.</p><ArenaSelect label="Local" emptyLabel="Sem local marcado" value={marked} onChange={arena => { setMarked(arena); setSport(''); }} /><label className="input-group">Modalidade<select className="input" value={sport} onChange={event => setSport(event.target.value)}><option value="">Sem modalidade</option>{sports.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{sportState.status === 'error' && <p className="form-error">Não foi possível carregar modalidades. O texto foi mantido.</p>}</details>}
        <p className="compose-privacy-note">{audience === 'private' ? 'Só participantes ativos do grupo escolhido podem ver.' : 'A publicação aparece no seu perfil e para pessoas do Pico.'}{game && ' Corrigir ou excluir o jogo depois não muda esta publicação.'}</p>
      </div>
    </details>
    {optionsError && <p className="form-error" role="alert">{optionsError} <Button type="button" size="small" variant="quiet" onClick={reloadOptions}>Tentar novamente</Button></p>}
    {!options && !optionsError && <p role="status" className="compose-loading">Conferindo onde você pode publicar…</p>}
    {message && <p className="form-error" role="alert">{message}</p>}
    {audience === 'private' && groups.length !== 1 && <p className="compose-privacy-note">Escolha um grupo privado antes de publicar.</p>}
    <div className="compose-footer"><div className="compose-footer-tools"><PhotoUpload compact bucket="post-media" path={photo} onChange={setPhoto} onBusy={value => { setUploading(value); onBusy(value || busy); }} /><span className="compose-count">{body.length}/500</span></div><Button type="submit" disabled={!canPublish}>{busy ? 'Publicando…' : 'Publicar'}</Button></div>
  </form>;
}

function WallArenaPicker({ arenas, value, onChange }: { arenas: PublicationOptions['arenas']; value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const input = useRef<HTMLInputElement>(null), disclosure = useRef<HTMLDetailsElement>(null);
  const selected = arenas.find(item => item.id === value);
  const needle = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const results = arenas.filter(item => item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').includes(needle)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base', numeric: true }));
  return <details ref={disclosure} className="compose-wall" onToggle={event => { if (event.currentTarget.open) requestAnimationFrame(() => input.current?.focus()); }}>
    <summary><span><strong>Mural de arena</strong><small>{selected?.name ?? 'Sem arena escolhida'}</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
    <div className="compose-wall-body">
      <label className="compose-wall-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar arena para o mural</span><input ref={input} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Busque pelo nome da arena" autoCapitalize="none" maxLength={100} /></label>
      <div className="compose-wall-results" role="group" aria-label="Arenas para o mural">
        {results.map(item => <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => { onChange(item.id); setSearch(''); if (disclosure.current) disclosure.current.open = false; requestAnimationFrame(() => disclosure.current?.querySelector('summary')?.focus()); }}>{item.name}</button>)}
        {!results.length && <p role="status">Nenhuma arena com esse nome.</p>}
      </div>
      {selected && <button className="compose-wall-clear" type="button" onClick={() => onChange('')}>Remover do mural</button>}
    </div>
  </details>;
}

function MentionSuggestions({ communityId, query, selectedCount, everyoneActive, onChoose }: { communityId: string; query: MentionQuery; selectedCount: number; everyoneActive: boolean; onChoose: (handle: string, person?: Person) => void }) {
  const { data, error, loading, reload } = useEntity<Person[]>(`/api/communities?kind=mentions&id=${communityId}&search=${encodeURIComponent(query.query)}`);
  const everyoneMatch = 'todos'.startsWith(query.query.toLocaleLowerCase('pt-BR'));
  return <div className="mention-results" role="group" aria-label="Pessoas para mencionar" onKeyDown={event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = buttons[(current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length];
    if (next) { event.preventDefault(); next.focus(); }
  }}>
    {!everyoneActive && everyoneMatch && <button type="button" onClick={() => onChoose('todos')}><strong>@todos</strong><span>Avisar a comunidade inteira</span></button>}
    {!everyoneActive && data?.map(person => <button type="button" key={person.id} disabled={selectedCount >= 20} onClick={() => onChoose(person.username, person)}><strong>{person.name}</strong><span>@{person.username}</span></button>)}
    {loading && <p role="status">Buscando pessoas…</p>}
    {error && <p className="form-error" role="alert">Não foi possível buscar. <Button type="button" size="small" variant="quiet" onClick={reload}>Tentar novamente</Button></p>}
    {!loading && !error && !everyoneMatch && data?.length === 0 && <p>Ninguém encontrado nesta comunidade.</p>}
    {selectedCount >= 20 && <p>Limite de 20 pessoas por publicação.</p>}
  </div>;
}

'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, PenLine, ArrowUpRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { Button } from '@/components/ui/Button';
import { PhotoUpload } from './Media';
import { useEntity, entityAction } from './useEntity';
import { useRemoteRead } from './useRemoteRead';
import { formatGameDate } from '@/lib/game-date';
import type { PublicationOptions } from '@/types/posts';
import type { PlayedGame } from '@/types/games';

export function PublicationComposer({ viewerId, arenaId, communityId, onDone }: { viewerId: string; arenaId?: string; communityId?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [published, setPublished] = useState<string | null>(null);
  return <div className="publication-composer">
    <button data-tour="publish" type="button" className="composer-trigger" aria-haspopup="dialog" onClick={() => { setPublished(null); setOpen(true); }}><span className="composer-symbol"><PenLine size={20} aria-hidden="true" /></span><span>Compartilhe com sua turma</span><Plus size={20} aria-hidden="true" /></button>
    <Modal open={open} onClose={() => { if (!busy) setOpen(false); }} title="Compartilhe com sua turma">
      <PublicationDraft key={`${viewerId}:${arenaId || ''}:${communityId || ''}`} arenaId={arenaId} communityId={communityId} onBusy={setBusy} onDone={id => { setPublished(id); setOpen(false); onDone(); }} />
    </Modal>
    {published && <p className="inline-success" role="status">Publicado nos destinos escolhidos. <Link className="journey-text-link" href={`/publicacoes/${published}`}>Ver publicação <ArrowUpRight size={16} aria-hidden="true" /></Link></p>}
  </div>;
}

export function PublicationDraft({ arenaId, communityId, game, onDone, onBusy }: { arenaId?: string; communityId?: string; game?: PlayedGame; onDone: (id: string) => void; onBusy: (busy: boolean) => void }) {
  const { data: options, error, reload } = useEntity<PublicationOptions>('/api/posts?kind=options');
  if (error) return <div><p className="form-error" role="alert">{error}</p><Button variant="secondary" onClick={reload}>Tentar novamente</Button></div>;
  if (!options) return <p role="status">Conferindo onde você pode publicar…</p>;
  return <Composer options={options} arenaId={arenaId} communityId={communityId} game={game} onDone={onDone} onBusy={onBusy} />;
}

function Composer({ options, arenaId, communityId, game, onDone, onBusy }: { options: PublicationOptions; arenaId?: string; communityId?: string; game?: PlayedGame; onDone: (id: string) => void; onBusy: (busy: boolean) => void }) {
  const initialGroup = options.communities.find(c => c.id === communityId);
  const [body, setBody] = useState(''), [photo, setPhoto] = useState<string | null>(null);
  const [audience, setAudience] = useState<'beta' | 'private'>(initialGroup?.visibility || 'beta');
  const [wall, setWall] = useState(options.arenas.some(a => a.id === arenaId) ? arenaId || '' : '');
  const [groups, setGroups] = useState<string[]>(initialGroup ? [initialGroup.id] : []);
  const [marked, setMarked] = useState(''), [sport, setSport] = useState('');
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [message, setMessage] = useState('');
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const { state } = useRemoteRead('resource=arenas&offset=0');
  const { state: sportState } = useRemoteRead('resource=sports');
  const arenas = state.status === 'success' && state.data.kind === 'arenas' ? state.data.arenas : [];
  const sports = marked ? arenas.find(a => a.id === marked)?.sports || [] : sportState.status === 'success' && sportState.data.kind === 'sports' ? sportState.data.sports : [];
  const destinationNames = [options.arenas.find(a => a.id === wall)?.name, ...options.communities.filter(c => groups.includes(c.id)).map(c => c.name)].filter(Boolean);
  return <form className="connected-form" onSubmit={async e => {
    e.preventDefault(); if (busy || uploading) return;
    const common = { body, imagePath: photo, audience, wallArena: wall || undefined, groups };
    const payload = game ? { ...common, id: game.id, version: game.version } : { ...common, action: 'publish', arena: marked || undefined, sport: sport || undefined };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    setBusy(true); onBusy(true); setMessage('');
    try {
      const id: unknown = await entityAction(game ? '/api/games/share' : '/api/posts', { ...payload, key: attempt.current.key });
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('A confirmação da publicação não chegou. Confira antes de tentar novamente.');
      setBody(''); setPhoto(null); attempt.current = null; onDone(id);
    } catch (e) { setMessage((e instanceof Error ? e.message : 'Não foi possível confirmar.') + ' Seu rascunho foi mantido. Repetir sem alterar os campos mantém a mesma publicação.'); }
    finally { setBusy(false); onBusy(false); }
  }}>
    <fieldset className="publication-fields" disabled={busy}>
      {game && <section className="game-share-context"><p>Você escolheu compartilhar este jogo</p><strong>{game.arena_name}</strong><span>{game.sport_name} · Jogado em {formatGameDate(game.played_on)}</span><p>O post mostrará arena, modalidade e data. O registro em Meus jogos continua privado.</p></section>}
      <label className="input-group">{game ? 'Conta como foi (opcional)' : 'Sua publicação'}<textarea className="input" value={body} onChange={e => setBody(e.target.value)} maxLength={500} required={!game} rows={3} placeholder="Uma história, uma foto, uma conversa depois do jogo…" /></label>
      <span className="input-hint">{body.length}/500</span>
      <PhotoUpload bucket="post-media" path={photo} onChange={setPhoto} onBusy={value => { setUploading(value); onBusy(value || busy); }} />
      <label className="input-group">Audiência<select className="input" value={audience} onChange={e => { const next = e.target.value as 'beta' | 'private'; setAudience(next); setGroups([]); if (next === 'private') setWall(''); }}><option value="beta">Pessoas do Pico</option><option value="private">Participantes de uma comunidade privada</option></select></label>
      {!game && <details className="publication-context"><summary>Modalidade e local (opcionais)</summary><p className="input-hint">Marcar um lugar não publica no mural da arena.</p><label className="input-group">Local<select className="input" value={marked} onChange={e => { setMarked(e.target.value); setSport(''); }}><option value="">Sem local marcado</option>{arenas.map(a => <option value={a.id} key={a.id}>{a.name}{a.isDemo ? ' · demo' : ''}</option>)}</select></label><label className="input-group">Modalidade<select className="input" value={sport} onChange={e => setSport(e.target.value)}><option value="">Sem modalidade</option>{sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>{(state.status === 'error' || sportState.status === 'error') && <p className="form-error">Não foi possível carregar os locais e modalidades. Seu texto continua disponível.</p>}</details>}
      <fieldset className="form-section"><legend>{audience === 'private' ? 'Escolha o grupo privado' : 'Distribuir também para'}</legend>
        {audience === 'beta' && <label className="input-group">Mural de arena<select className="input" value={wall} onChange={e => setWall(e.target.value)}><option value="">Não publicar em mural de arena</option>{options.arenas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
        <div className="choice-chips">{options.communities.filter(c => c.visibility === audience).map(c => <ChoiceChip key={c.id} checked={groups.includes(c.id)} onChange={e => setGroups(e.target.checked ? (audience === 'private' ? [c.id] : [...groups, c.id]) : groups.filter(id => id !== c.id))}>{c.name}{c.visibility === 'private' ? ' · privado' : ''}</ChoiceChip>)}</div>
        {!options.communities.some(c => c.visibility === audience) && <p className="input-hint">Você ainda não participa de uma comunidade com esta audiência.</p>}
      </fieldset>
      <div className="publication-audience-summary"><strong>Quem vai ver</strong><p>{audience === 'beta' ? 'Pessoas do Pico, pelo seu perfil e feed.' : 'Somente participantes ativos do grupo privado escolhido, inclusive no seu perfil.'}</p>{destinationNames.length > 0 ? <p>Destino{destinationNames.length > 1 ? 's' : ''}: {destinationNames.join(' · ')}.</p> : <p>Sem mural adicional.</p>}{game && <p>Corrigir ou excluir o registro privado depois não altera esta publicação.</p>}</div>
      {message && <p className="form-error" role="alert">{message}</p>}
      <Button type="submit" disabled={busy || uploading || (!game && !body.trim()) || groups.length > 5 || (audience === 'private' && groups.length !== 1)}>{busy ? 'Publicando…' : audience === 'private' ? 'Publicar no grupo privado' : destinationNames.length ? 'Publicar nos destinos escolhidos' : 'Publicar no meu perfil'}</Button>
    </fieldset>
  </form>;
}

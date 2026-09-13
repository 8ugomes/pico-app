'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Plus, Send, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { useDemo } from './DemoProvider';
import { PlayerAvatar } from './PlayerAvatar';
import { validatePost } from '@/lib/demo-state';
import { formatGameDate } from '@/lib/game-date';
import type { SportId } from '@/types/social';
import type { PlayedGame } from '@/types/games';

export function PostComposer({ fixedArenaId, fixedCommunityId, game, initiallyOpen = false }: { fixedArenaId?: string; fixedCommunityId?: string; game?: PlayedGame; initiallyOpen?: boolean }) {
  const { state, dispatch, now, me } = useDemo();
  const initialCommunity = state.communities.find(c => c.id === fixedCommunityId);
  const [open, setOpen] = useState(initiallyOpen);
  const [arenaId, setArenaId] = useState(game?.arena_id ?? fixedArenaId ?? initialCommunity?.arenaId ?? state.arenas[0].id);
  const arena = state.arenas.find(a => a.id === arenaId)!;
  const [sportId, setSportId] = useState<SportId>(game?.sport_slug ?? arena.sports[0]);
  const [content, setContent] = useState(''), [error, setError] = useState(''), [published, setPublished] = useState<string | null>(null);
  const [audience, setAudience] = useState<'beta' | 'private'>(initialCommunity?.visibility ?? 'beta');
  const [groups, setGroups] = useState<string[]>(initialCommunity ? [initialCommunity.id] : []);
  const [wall, setWall] = useState(Boolean(fixedArenaId && state.followedArenaIds.includes(fixedArenaId)));
  const [photo, setPhoto] = useState(false);
  const attempt = useRef<string | null>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    const input = { arenaId, sportId, content, audience, communityIds: groups, distributedToArena: wall, ...(game ? { gameId: game.id, gameVersion: game.version } : {}) };
    const invalid = validatePost(state, input);
    if (invalid) { setError(invalid); return; }
    attempt.current ??= crypto.randomUUID();
    dispatch({ type: 'post', input: { ...input, ...(photo ? { photo: '/images/urban-court.webp' } : {}) }, id: attempt.current, now });
    setPublished(attempt.current); attempt.current = null; setContent(''); setError(''); setOpen(false);
  }
  return <>
    {game ? <Button variant="secondary" size="small" onClick={() => setOpen(true)}><Share2 size={16} aria-hidden="true" />Compartilhar jogo</Button> : <button data-tour="publish" type="button" className="composer-trigger" aria-haspopup="dialog" onClick={() => { setPublished(null); setOpen(true); }}><PlayerAvatar player={me} size="small" /><span>Compartilhe com sua turma</span><Plus size={20} aria-hidden="true" /></button>}
    {published && <p className="inline-success" role="status">Publicado somente nesta demonstração. <Link className="journey-text-link" href={`/publicacoes/${published}`}>Ver publicação</Link></p>}
    <Modal open={open} onClose={() => setOpen(false)} title={game ? 'Compartilhar jogo' : 'Compartilhe com sua turma'}><form onSubmit={submit} className="connected-form">
      {game && <section className="game-share-context"><strong>{game.arena_name}</strong><span>{game.sport_name} · Jogado em {formatGameDate(game.played_on)}</span><p>Compartilhar aqui cria um post local. Seu registro em Meus jogos continua privado.</p></section>}
      <label className="input-group">{game ? 'Conta como foi (opcional)' : 'Sua publicação'}<textarea className="input" value={content} onChange={e => setContent(e.target.value)} maxLength={500} rows={3} required={!game} /></label><span className="input-hint">{content.length}/500</span>
      <ChoiceChip checked={photo} onChange={e => setPhoto(e.target.checked)}>Incluir imagem ilustrativa da arena</ChoiceChip>
      {!game && <div className="form-columns"><label className="input-group">Local marcado<select className="input" value={arenaId} disabled={Boolean(fixedArenaId)} onChange={e => { const next = state.arenas.find(a => a.id === e.target.value)!; setArenaId(next.id); setSportId(next.sports[0]); setWall(false); }}>{state.arenas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="input-group">Modalidade<select className="input" value={sportId} onChange={e => setSportId(e.target.value as SportId)}>{arena.sports.map(id => <option key={id} value={id}>{state.sports.find(s => s.id === id)?.name}</option>)}</select></label></div>}
      <label className="input-group">Audiência<select className="input" value={audience} onChange={e => { setAudience(e.target.value as 'beta' | 'private'); setGroups([]); setWall(false); }}><option value="beta">Pessoas do Pico · simulação</option><option value="private">Grupo privado · simulação</option></select></label>
      <fieldset className="form-section"><legend>Destinos nesta demonstração</legend>{audience === 'beta' && state.followedArenaIds.includes(arenaId) && <ChoiceChip checked={wall} onChange={e => setWall(e.target.checked)}>Mural de {arena.name}</ChoiceChip>}<div className="choice-chips">{state.communities.filter(c => c.visibility === audience && c.members.includes(me.id)).map(c => <ChoiceChip checked={groups.includes(c.id)} key={c.id} onChange={e => setGroups(e.target.checked ? audience === 'private' ? [c.id] : [...groups, c.id] : groups.filter(id => id !== c.id))}>{c.name}</ChoiceChip>)}</div>{audience === 'private' && !state.communities.some(c => c.visibility === 'private' && c.members.includes(me.id)) && <p>Você não participa de um grupo privado nesta demonstração.</p>}</fieldset>
      <p className="form-note">{audience === 'private' ? 'Só participantes ativos do grupo escolhido veriam este conteúdo.' : 'Esta audiência representa as pessoas do Pico.'} O post permanece apenas nesta sessão. Registrar um jogo não seleciona um mural nem publica automaticamente.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button type="submit" disabled={(!content.trim() && !game) || (audience === 'private' && groups.length !== 1)}>Publicar nesta demonstração <Send size={17} aria-hidden="true" /></Button>
    </form></Modal>
  </>;
}

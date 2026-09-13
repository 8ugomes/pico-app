'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { PlayedGame } from '@/types/games';
import type { SportId } from '@/types/social';
import { validGameDate } from '@/lib/game-date';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PostComposer } from './PostComposer';
import { useDemo } from './DemoProvider';
import { PageHeading } from './SocialUI';
import { GameDateField, GameEntries, JournalPrivacy } from './GameJournal';
export function GamesView({ initialArenaId }: { initialArenaId?: string }) {
  const {state, me, dispatch} = useDemo();
  const [open, setOpen] = useState(Boolean(initialArenaId));
  const [editing, setEditing] = useState<PlayedGame | null>(null);
  const [deleting, setDeleting] = useState<PlayedGame | null>(null);
  const [arenaId, setArenaId] = useState(initialArenaId ?? '');
  const [sportId, setSportId] = useState<SportId | ''>(state.arenas.find(a => a.id === initialArenaId)?.sports[0] ?? '');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const arena = state.arenas.find(a => a.id === arenaId);
  const games: PlayedGame[] = state.games.filter(g => g.playerId === me.id).sort((a,b) => b.playedOn.localeCompare(a.playedOn)).map(g => {
    const place = state.arenas.find(a => a.id === g.arenaId)!;
    return { id:g.id,arena_id:place.id,arena_name:place.name,arena_slug:place.slug,is_demo:true,sport_id:g.sportId,sport_slug:g.sportId,sport_name:state.sports.find(s => s.id === g.sportId)!.name,played_on:g.playedOn,created_at:g.createdAt,updated_at:g.createdAt,version:g.version };
  });
  return <>
    <Link href="/perfil" className="detail-back">Voltar ao perfil</Link><PageHeading title="Meus jogos" />
    <p className="page-intro">Guarde onde você jogou e a data de cada encontro.</p><JournalPrivacy />
    <p className="form-note">Demonstração: os registros do jogador fictício ficam somente nesta sessão e somem ao recarregar.</p>
    <Button data-tour="register-game" onClick={() => {if(editing){setEditing(null);setArenaId('');setSportId('');setDate('');}setError('');setOpen(true);setMessage('');}}>Registrar jogo</Button>
    {message && <p role="status" className="inline-success">{message}</p>}
    <GameEntries games={games} shareControl={game => <PostComposer key={`${game.id}:${game.version}`} game={game} />} onEdit={g => {setEditing(g);setArenaId(g.arena_id);setSportId(g.sport_slug);setDate(g.played_on);setError('');setOpen(true);}} onDelete={setDeleting} />
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Corrigir jogo' : 'Joguei aqui'}><form className="connected-form" onSubmit={e => {
      e.preventDefault();
      if (!arena || !sportId || !arena.sports.includes(sportId) || !validGameDate(date)) {setError('Escolha arena, modalidade e uma data até hoje.');return;}
      dispatch({type:'save_game',id:editing?.id ?? crypto.randomUUID(),arenaId,sportId,playedOn:date,...(editing ? {version:editing.version} : {})});
      setOpen(false);setArenaId('');setSportId('');setDate('');setEditing(null);setMessage(editing ? 'Jogo corrigido nesta demonstração.' : 'Jogo registrado nesta demonstração. Só você vê.');
    }}><JournalPrivacy /><label className="input-group">Arena<select className="input" required value={arenaId} onChange={e => {setArenaId(e.target.value);setSportId(state.arenas.find(a => a.id === e.target.value)?.sports[0] ?? '');}}><option value="">Escolha onde jogou</option>{state.arenas.map(a => <option value={a.id} key={a.id}>{a.name} · Demo</option>)}</select></label>
    {arena && <label className="input-group">Esporte<select className="input" required value={sportId} onChange={e => setSportId(e.target.value as SportId)}>{arena.sports.map(s => <option key={s} value={s}>{state.sports.find(x => x.id === s)?.name}</option>)}</select></label>}
    <GameDateField value={date} onChange={setDate} /><p className="form-note">Registro declarado por você, sem comprovação de presença física. Nenhuma publicação ou aviso será enviado.</p>{error && <p role="alert" className="form-error">{error}</p>}<Button type="submit" disabled={!sportId || !date}>{editing ? 'Salvar correção' : 'Guardar só para mim'}</Button></form></Modal>
    <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Excluir este registro?"><p>O jogo em {deleting?.arena_name} sairá desta demonstração. Publicações e comentários continuam como estão.</p><Button onClick={() => {if(deleting) dispatch({type:'delete_game',id:deleting.id});setDeleting(null);setMessage('Registro excluído nesta demonstração.');}}>Excluir registro</Button><Button variant="quiet" onClick={() => setDeleting(null)}>Manter jogo</Button></Modal>
  </>;
}

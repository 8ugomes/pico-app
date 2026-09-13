'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarDays, LockKeyhole, Share2 } from 'lucide-react';
import type { PlayedGame } from '@/types/games';
import { formatGameDate, gameToday } from '@/lib/game-date';
import { Button } from '@/components/ui/Button';
import { EmptyState } from './SocialUI';
export function GameDateField({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  return <label className="input-group">Data do jogo<input className="input" type="date" required min="1900-01-01" max={gameToday()} value={value} onChange={e => onChange(e.target.value)} /><span className="input-hint">Escolha um jogo que já terminou. Esta é a data em que você jogou.</span></label>;
}
export function JournalPrivacy() {
  return <p className="journal-privacy"><LockKeyhole size={17} aria-hidden="true" /><span>Só você vê. Registrar um jogo não cria uma publicação.</span></p>;
}
export function GameEntries({ games, onEdit, onDelete, onShare, shareControl, busy = false }: { games: PlayedGame[]; onEdit: (game: PlayedGame) => void; onDelete: (game: PlayedGame) => void; onShare?: (game: PlayedGame) => void; shareControl?: (game: PlayedGame) => ReactNode; busy?: boolean }) {
  if (!games.length) return <EmptyState title="As lembranças começam com um jogo.">Depois de jogar, guarde a arena, a modalidade e a data em “Registrar jogo”.</EmptyState>;
  return <div className="game-journal">{games.map(game => <article className="game-entry" key={game.id}>
    <CalendarDays size={22} aria-hidden="true" /><div className="game-entry-content">
      <p className="game-entry-date">Jogado em <time dateTime={game.played_on}>{formatGameDate(game.played_on)}</time></p>
      <h2><Link href={`/arenas/${game.arena_slug}`}>{game.arena_name}</Link></h2>
      <p>{game.sport_name}{game.is_demo ? ' · Arena de demonstração' : ''}</p>
      <div className="game-entry-actions">{shareControl?.(game)}{onShare && <Button variant="secondary" size="small" disabled={busy} onClick={() => onShare(game)}><Share2 size={16} aria-hidden="true" />Compartilhar jogo</Button>}<Button variant="quiet" size="small" disabled={busy} onClick={() => onEdit(game)}>Corrigir jogo</Button><Button variant="quiet" size="small" disabled={busy} onClick={() => onDelete(game)}>Excluir registro</Button></div>
    </div>
  </article>)}</div>;
}

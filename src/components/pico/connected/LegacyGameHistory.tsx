'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatGameDate } from '@/lib/game-date';
import { useEntity } from './useEntity';
type LegacyRecord = { id: string; arena_name: string; arena_slug: string; sport_name: string; recorded_on: string };
export function LegacyGameHistory() {
  const [open, setOpen] = useState(false);
  return <details className="legacy-history" onToggle={event => setOpen(event.currentTarget.open)}><summary>Histórico anterior · só você vê</summary><p>Registros do antigo check-in, preservados para você. Não foram convertidos em jogos ou publicações.</p>{open && <LegacyEntries />}</details>;
}
function LegacyEntries() {
  const [offset, setOffset] = useState(0);
  const { data, error, reload } = useEntity<LegacyRecord[]>(`/api/games/legacy?offset=${offset}`);
  return <>{!data && !error && <p role="status">Carregando seu histórico anterior…</p>}{error && <><p role="alert">{error}</p><Button variant="secondary" onClick={reload}>Tentar novamente</Button></>}{data?.length === 0 && <p>Você não tem registros anteriores.</p>}<ul className="legacy-records">{data?.slice(0, 20).map(item => <li key={item.id}><Link href={`/arenas/${item.arena_slug}`}>{item.arena_name}</Link><span>{item.sport_name} · Registro de <time dateTime={item.recorded_on}>{formatGameDate(item.recorded_on)}</time></span></li>)}</ul>{data && (offset > 0 || data.length > 20) && <nav className="read-pagination" aria-label="Páginas do histórico anterior"><Button variant="secondary" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><Button variant="secondary" disabled={data.length <= 20} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}</>;
}

'use client';
import { useEffect, useState } from 'react';
import type { ReadArena } from '@/types/read';
import { Button } from '@/components/ui/Button';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
export function ArenaSportPicker({ initialSlug, value, onChange }: { initialSlug?: string; value: { arena: ReadArena; sportId: string } | null; onChange: (value: { arena: ReadArena; sportId: string } | null) => void }) {
  const [slug, setSlug] = useState(initialSlug);
  const [offset, setOffset] = useState(0);
  const { state, retry } = useRemoteRead(slug ? `resource=arena&slug=${encodeURIComponent(slug)}` : `resource=arenas&offset=${offset}`);
  const data = state.status === 'success' ? state.data : null;
  useEffect(() => {
    if (slug && data?.kind === 'arena' && !value) onChange({ arena: data.arena, sportId: data.arena.sports[0]?.id ?? '' });
  }, [slug, data, value, onChange]);
  const arenas = data?.kind === 'arena' ? [data.arena] : data?.kind === 'arenas' ? data.arenas : [];
  return <>
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && <>
      <label className="input-group">Arena<select className="input" required value={value?.arena.id ?? ''} onChange={e => { const arena = arenas.find(a => a.id === e.target.value); onChange(arena ? { arena, sportId: arena.sports[0]?.id ?? '' } : null); }}><option value="" disabled>Escolha onde jogar</option>{arenas.map(a => <option key={a.id} value={a.id} disabled={!a.sports.length}>{a.name}{a.isDemo ? ' · Demo' : ''}</option>)}</select></label>
      {value && <label className="input-group">Esporte<select className="input" required value={value.sportId} onChange={e => onChange({ ...value, sportId: e.target.value })}>{value.arena.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      {!arenas.length && <p role="status">Nenhuma arena disponível nesta página.</p>}
      {slug ? <Button size="small" variant="quiet" onClick={() => { setSlug(undefined); onChange(null); }}>Escolher outra arena</Button> : data.kind === 'arenas' && (offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label="Páginas de arenas"><Button size="small" variant="quiet" disabled={!offset} onClick={() => { setOffset(offset - 24); onChange(null); }}>Anterior</Button><span>Página {offset / 24 + 1}</span><Button size="small" variant="quiet" disabled={!data.hasMore} onClick={() => { setOffset(offset + 24); onChange(null); }}>Próxima</Button></nav>}
    </>}
  </>;
}

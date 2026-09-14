'use client';
import { useEffect, useState } from 'react';
import type { ReadArena } from '@/types/read';
import { Button } from '@/components/ui/Button';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { ArenaSelect } from './ArenaSelect';
export function ArenaSportPicker({ initialSlug, value, onChange }: { initialSlug?: string; value: { arena: ReadArena; sportId: string } | null; onChange: (value: { arena: ReadArena; sportId: string } | null) => void }) {
  const [slug, setSlug] = useState(initialSlug);
  const [choosing, setChoosing] = useState(!value && !initialSlug);
  const { state, retry } = useRemoteRead(`resource=arena&slug=${encodeURIComponent(slug ?? '')}`, Boolean(slug));
  const data = state.status === 'success' && state.data.kind === 'arena' ? state.data : null;
  useEffect(() => {
    if (slug && data && !value) onChange({ arena: data.arena, sportId: data.arena.sports[0]?.id ?? '' });
  }, [slug, data, value, onChange]);
  return <>
    {slug ? <>
      {state.status === 'loading' && <ReadLoading />}
      {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
      {data && <p className="game-selected-place"><strong>{data.arena.name}</strong><span>{data.arena.city}</span></p>}
      <Button type="button" size="small" variant="quiet" onClick={() => { setSlug(undefined); setChoosing(true); }}>Trocar arena</Button>
    </> : value && !choosing ? <p className="game-selected-place"><strong>{value.arena.name}</strong><span>{value.arena.city}</span><Button type="button" size="small" variant="quiet" onClick={() => setChoosing(true)}>Trocar arena</Button></p>
      : <ArenaSelect required label="Onde você jogou?" emptyLabel="Escolha a arena" value={value?.arena ?? null} onChange={arena => { onChange(arena ? { arena, sportId: arena.sports[0]?.id ?? '' } : null); if (arena) setChoosing(false); }} />}
    {value && <label className="input-group">Modalidade<select className="input" required value={value.sportId} onChange={e => onChange({ ...value, sportId: e.target.value })}>{value.arena.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
  </>;
}

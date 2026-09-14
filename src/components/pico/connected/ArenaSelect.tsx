'use client';
import { useState } from 'react';
import type { ReadArena } from '@/types/read';
import { Button } from '@/components/ui/Button';
import { SearchField } from '../SocialUI';
import { useSearchInput } from '../useSearchInput';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';

export function ArenaSelect({ value, onChange, label = 'Arena', emptyLabel = 'Escolha uma arena', required = false, tourId }: {
  value: ReadArena | null; onChange: (arena: ReadArena | null) => void;
  label?: string; emptyLabel?: string; required?: boolean; tourId?: string;
}) {
  const { search, setSearch, settled, pending } = useSearchInput();
  const [offset, setOffset] = useState(0);
  const { state, retry } = useRemoteRead(new URLSearchParams({ resource: 'arenas', search: settled, offset: String(offset) }).toString(), !pending);
  const data = !pending && state.status === 'success' && state.data.kind === 'arenas' ? state.data : null;
  // Keep the chosen identity visible when searching or paging; searching never changes a form value.
  const options = data?.arenas.filter(a => a.id !== value?.id) ?? [];
  if (value) options.unshift(value);
  return <div className="connected-form arena-select">
    <SearchField label={`Buscar arena para ${label.toLocaleLowerCase('pt-BR')}`} placeholder="Nome, bairro ou cidade" maxLength={100} value={search} onChange={text => { setSearch(text); setOffset(0); }} />
    <label className="input-group">{label}<select data-tour={tourId} className="input" required={required} value={value?.id ?? ''} onChange={e => onChange(options.find(a => a.id === e.target.value) ?? null)}>
      <option value="" disabled={required}>{emptyLabel}</option>
      {options.map(a => <option key={a.id} value={a.id} disabled={required && !a.sports.length}>{a.name} · {a.city}{a.isDemo ? ' · Demo' : ''}</option>)}
    </select></label>
    {(pending || state.status === 'loading') && <ReadLoading />}
    {!pending && (state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {data && !data.arenas.length && <p role="status">Nenhuma arena nesta busca. Tente outro nome ou cidade.</p>}
    {data && (offset > 0 || data.hasMore) && <nav className="read-pagination" aria-label={`Páginas de ${label.toLocaleLowerCase('pt-BR')}`}>
      <Button type="button" size="small" variant="quiet" disabled={!offset} onClick={() => setOffset(offset - 24)}>Anterior</Button>
      <span>Página {offset / 24 + 1}</span>
      <Button type="button" size="small" variant="quiet" disabled={!data.hasMore} onClick={() => setOffset(offset + 24)}>Próxima</Button>
    </nav>}
  </div>;
}

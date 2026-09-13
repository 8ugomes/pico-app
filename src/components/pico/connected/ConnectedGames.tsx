'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import type { ReadArena } from '@/types/read';
import type { PlayedGame } from '@/types/games';
import { gameToday, validGameDate } from '@/lib/game-date';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeading } from '../SocialUI';
import { GameDateField, GameEntries, JournalPrivacy } from '../GameJournal';
import { ArenaSportPicker } from './ArenaSportPicker';
import { useEntity, entityAction } from './useEntity';
import { PublicationDraft } from './PublicationComposer';
import { LegacyGameHistory } from './LegacyGameHistory';

export function ConnectedGames({ initialSlug }: { initialSlug?: string }) {
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useEntity<PlayedGame[]>(`/api/games?offset=${offset}`);
  const [form, setForm] = useState<{game?: PlayedGame; slug?: string} | null>(initialSlug ? {slug: initialSlug} : null);
  const [editorOpen, setEditorOpen] = useState(Boolean(initialSlug));
  const [share, setShare] = useState<PlayedGame | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PlayedGame | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  return <>
    <Link href="/perfil" className="detail-back">Voltar ao perfil</Link>
    <PageHeading eyebrow="DEPOIS DA AREIA" title="Meus jogos" />
    <p className="page-intro">Um lugar para guardar onde você jogou e as datas de cada encontro.</p>
    <JournalPrivacy />
    <Button onClick={() => { setMessage(''); setForm(previous => previous && !previous.game ? previous : {}); setEditorOpen(true); }}>Registrar jogo</Button>
    {message && <p role="status" className="inline-success">{message}</p>}
    {loading && <p role="status">Carregando seus jogos…</p>}
    {error && <div className="connected-panel"><p role="alert">{error}</p><Button variant="secondary" onClick={reload}>Tentar novamente</Button></div>}
    {data && <GameEntries games={data.slice(0, 20)} onShare={game => { setShare(game); setShareOpen(true); setPublished(null); }} onEdit={game => { setForm({game, slug: game.arena_slug}); setEditorOpen(true); }} onDelete={game => { setDeleteError(''); setDeleting(game); }} />}
    {(offset > 0 || (data?.length ?? 0) > 20) && <nav className="read-pagination" aria-label="Páginas dos seus jogos"><Button variant="secondary" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><span>Página {offset / 20 + 1}</span><Button variant="secondary" disabled={!data || data.length <= 20} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}
    <Modal open={editorOpen} onClose={() => { if (!busy) setEditorOpen(false); }} title={form?.game ? 'Corrigir jogo' : 'Joguei aqui'}>
      {form && <GameForm key={form.game?.id ?? form.slug ?? 'new'} initialSlug={form.slug} game={form.game} onBusy={setBusy} onDone={() => { setEditorOpen(false); setForm(null); setOffset(0); reload(); setMessage(form.game ? 'Jogo corrigido. Seu registro continua privado.' : 'Jogo registrado. Só você pode ver.'); }} />}
    </Modal>
    {published && <p className="inline-success" role="status">Jogo compartilhado. <Link className="journey-text-link" href={`/publicacoes/${published}`}>Ver publicação</Link></p>}
    <Modal open={shareOpen} onClose={() => { if (!busy) setShareOpen(false); }} title="Compartilhar jogo">
      {share && <PublicationDraft key={`${share.id}:${share.version}`} game={share} onBusy={setBusy} onDone={id => { setShareOpen(false); setShare(null); setPublished(id); }} />}
    </Modal>
    <LegacyGameHistory />
    <Modal open={Boolean(deleting)} onClose={() => { if (!busy) setDeleting(null); }} title="Excluir este registro?">
      <p>O jogo em {deleting?.arena_name} sairá de Meus jogos. Publicações e comentários continuam como estão.</p>
      {deleteError && <p role="alert" className="form-error">{deleteError}</p>}
      <Button disabled={busy} onClick={async () => { if (!deleting) return; setBusy(true); try { await entityAction('/api/games', {action:'delete', id:deleting.id}); setDeleting(null); setMessage('Registro excluído.'); if (data?.length === 1 && offset) setOffset(offset - 20); else reload(); } catch (e) { setDeleteError(e instanceof Error ? e.message : 'Não foi possível confirmar.'); } finally { setBusy(false); } }}>{busy ? 'Excluindo…' : 'Excluir registro'}</Button>
      <Button variant="quiet" disabled={busy} onClick={() => setDeleting(null)}>Manter jogo</Button>
    </Modal>
  </>;
}
function GameForm({ game, initialSlug, onBusy, onDone }: { game?: PlayedGame; initialSlug?: string; onBusy: (busy: boolean) => void; onDone: () => void }) {
  const [selection, setSelection] = useState<{arena: ReadArena; sportId: string} | null>(game ? {
    arena: {id:game.arena_id,slug:game.arena_slug,name:game.arena_name,description:'',city:'',neighborhood:'',image:null,isDemo:game.is_demo,sports:[{id:game.sport_id,slug:game.sport_slug,name:game.sport_name}]}, sportId:game.sport_id,
  } : null);
  const [date, setDate] = useState(game?.played_on ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const attempt = useRef<string | null>(game?.id ?? null);
  return <form className="connected-form" onSubmit={async e => {
    e.preventDefault();
    if (busy || !selection || !validGameDate(date)) { setError('Escolha a arena, a modalidade e uma data até hoje.'); return; }
    attempt.current ??= crypto.randomUUID();
    setBusy(true); onBusy(true); setError('');
    try {
      await entityAction('/api/games', {action:'save',id:attempt.current,arenaId:selection.arena.id,sportId:selection.sportId,playedOn:date,...(game ? {version:game.version} : {})});
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível confirmar.'); }
    finally { setBusy(false); onBusy(false); }
  }}><fieldset disabled={busy}>
    <JournalPrivacy /><ArenaSportPicker initialSlug={initialSlug} value={selection} onChange={setSelection} />
    <GameDateField value={date} onChange={setDate} />
    <p className="form-note">Este registro é declarado por você. Não comprova presença física e não avisa outras pessoas.</p>
    {error && <p role="alert" className="form-error">{error} Seus campos foram mantidos.</p>}
    <Button type="submit" disabled={!selection?.sportId || !date || date > gameToday()}>{busy ? 'Salvando…' : game ? 'Salvar correção' : 'Guardar só para mim'}</Button>
  </fieldset></form>;
}

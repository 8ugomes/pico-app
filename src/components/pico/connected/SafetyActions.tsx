'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Pencil, Trash2, UserRoundX, PanelTopClose } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ContentMenu, type ContentMenuItem } from '../ContentMenu';
import { useMutation, MutationNotice } from './useMutation';

type EditableContent = { body: string; maxLength: number; save: (body: string) => Promise<void> };
export function SafetyActions({ target, id, own = false, playerId, name, edit, onRemoveFromWall, onChange }: {
  target: 'player' | 'post' | 'comment'; id: string; own?: boolean; playerId?: string; name?: string;
  edit?: EditableContent; onRemoveFromWall?: () => void; onChange: () => void;
}) {
  const [mode, setMode] = useState<'report' | 'block' | 'delete' | 'edit' | null>(null);
  const [reason, setReason] = useState<'spam' | 'harassment' | 'unsafe' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const mutation = useMutation();
  const router = useRouter();
  const noun = target === 'player' ? 'perfil' : target === 'post' ? 'publicação' : 'comentário';
  const items: ContentMenuItem[] = [];
  const chooseMode = (next: typeof mode) => { mutation.clearMessage(); setMode(next); };
  if (own && target !== 'player') {
    if (edit) items.push({ label: `Editar ${noun}`, icon: <Pencil size={19} aria-hidden="true" />, onSelect: () => { setDraft(edit.body); setEditError(''); chooseMode('edit'); } });
    items.push({ label: `Excluir ${noun}`, icon: <Trash2 size={19} aria-hidden="true" />, destructive: true, onSelect: () => chooseMode('delete') });
  } else if (!own) {
    items.push({ label: 'Denunciar', icon: <Flag size={19} aria-hidden="true" />, onSelect: () => chooseMode('report') });
    if (playerId) items.push({ label: 'Bloquear jogador', icon: <UserRoundX size={19} aria-hidden="true" />, onSelect: () => chooseMode('block') });
  }
  if (onRemoveFromWall) items.push({ label: 'Retirar deste mural', icon: <PanelTopClose size={19} aria-hidden="true" />, onSelect: onRemoveFromWall });
  const title = mode === 'edit' ? `Editar ${noun}` : mode === 'report' ? 'Denunciar' : mode === 'block' ? 'Bloquear jogador?' : `Excluir ${noun}?`;
  return <>
    <ContentMenu label={`Opções ${target === 'post' ? 'da' : 'do'} ${noun}${name ? ` de ${name}` : ''}`} items={items} />
    <Modal open={mode !== null} onClose={() => { if (!mutation.busy && !saving) setMode(null); }} title={title}>
      {mode === 'edit' && edit ? <form className="connected-form" onSubmit={async e => {
        e.preventDefault(); if (saving || !draft.trim() || draft.trim().length > edit.maxLength) return;
        setSaving(true); setEditError('');
        try { await edit.save(draft.trim()); setMode(null); onChange(); }
        catch (error) { setEditError(error instanceof Error && !['TypeError', 'TimeoutError', 'AbortError'].includes(error.name) ? error.message : 'Não foi possível confirmar a alteração. Atualize para conferir antes de tentar de novo.'); }
        finally { setSaving(false); }
      }}>
        <label className="input-group">{target === 'comment' ? 'Comentário' : 'Texto'}<textarea className="input" data-dialog-autofocus rows={4} maxLength={edit.maxLength} required value={draft} onChange={e => setDraft(e.target.value)} disabled={saving} /></label>
        <div className="content-edit-actions"><Button type="button" variant="secondary" disabled={saving} onClick={() => setMode(null)}>Cancelar</Button><Button type="submit" disabled={saving || !draft.trim() || draft.trim() === edit.body}>{saving ? 'Salvando…' : 'Salvar alteração'}</Button></div>
        {editError && <p className="form-error" role="alert">{editError}</p>}
      </form> : mode === 'report' ? <form className="connected-form" onSubmit={async e => {
        e.preventDefault();
        if (await mutation.run({ action: 'report', target, id, reason, details }, 'Denúncia registrada. Só você e a equipe podem vê-la.')) { setMode(null); setDetails(''); }
      }}><fieldset disabled={mutation.busy}>
        <label className="input-group">Motivo<select className="input" value={reason} onChange={e => setReason(e.target.value as typeof reason)}><option value="spam">Spam</option><option value="harassment">Assédio ou ofensa</option><option value="unsafe">Conteúdo perigoso ou indevido</option><option value="other">Outro motivo</option></select></label>
        <label className="input-group">O que aconteceu? (opcional)<textarea className="input" maxLength={500} rows={3} value={details} onChange={e => setDetails(e.target.value)} /></label>
        <p className="form-note">A denúncia é privada. Não inclua senhas ou dados sensíveis.</p><Button type="submit">{mutation.busy ? 'Enviando…' : 'Enviar denúncia'}</Button>
      </fieldset></form> : <>
        <p className="form-note">{mode === 'block' ? 'Vocês deixarão de ver os perfis, publicações e fotos um do outro. As conexões serão removidas. Você pode desbloquear em Privacidade e conta.' : 'O conteúdo será removido e não poderá ser recuperado.'}</p>
        <div className="content-edit-actions"><Button variant="secondary" disabled={mutation.busy} onClick={() => setMode(null)}>Cancelar</Button><Button disabled={mutation.busy} onClick={async () => {
          const input = mode === 'block' && playerId ? { action: 'set_block' as const, playerId, blocked: true } : { action: (target === 'post' ? 'delete_post' : 'delete_comment') as 'delete_post' | 'delete_comment', id };
          if (await mutation.run(input, mode === 'block' ? 'Jogador bloqueado.' : 'Conteúdo excluído.')) { setMode(null); onChange(); if (mode === 'block' && target === 'player') router.replace('/descobrir'); }
        }}>{mutation.busy ? 'Aguarde…' : mode === 'block' ? 'Bloquear' : 'Excluir definitivamente'}</Button></div>
      </>}
      <MutationNotice message={mutation.message} />
    </Modal>
    {mode === null && mutation.message && <div className="content-action-notice"><MutationNotice compact message={mutation.message} /></div>}
  </>;
}

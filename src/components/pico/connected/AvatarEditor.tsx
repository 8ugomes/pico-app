'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PhotoUpload, removePhoto } from './Media';
import { useMutation, MutationNotice } from './useMutation';

export function AvatarEditor({ currentPath, onChange, expanded = false, onBusyChange, onPendingChange }: {
  currentPath: string | null;
  onChange: () => void;
  expanded?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [path, setPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cleanup, setCleanup] = useState(false);
  const mutation = useMutation();

  function select(next: string | null) {
    setPath(next);
    onPendingChange?.(Boolean(next));
  }

  async function save(next: string | null) {
    if (uploading || mutation.busy) return;
    onBusyChange?.(true);
    try {
      if (await mutation.run({ action: 'set_avatar', path: next }, next ? 'Foto de perfil atualizada.' : 'Foto de perfil removida.')) {
        select(null);
        onChange();
        if (currentPath && currentPath !== next) {
          try { await removePhoto('avatars', currentPath); }
          catch { setCleanup(true); }
        }
      }
    } finally { onBusyChange?.(false); }
  }

  const controls = <>
    <PhotoUpload bucket="avatars" path={path} onChange={select} onBusy={busy => { setUploading(busy); onBusyChange?.(busy); }} />
    <div className="read-message-actions">
      <Button type="button" disabled={!path || uploading || mutation.busy} onClick={() => save(path)}>Usar esta foto</Button>
      {currentPath && <Button type="button" variant="quiet" disabled={uploading || mutation.busy} onClick={() => save(null)}>Remover foto atual</Button>}
    </div>
    <MutationNotice message={mutation.message} />
    {cleanup && <p role="status" className="form-note">O perfil foi atualizado. Remova a foto antiga em Privacidade e conta.</p>}
  </>;

  return expanded ? <div data-testid="avatar-editor">{controls}</div> : <details className="connected-panel" data-testid="avatar-editor"><summary>Editar foto de perfil</summary>{controls}</details>;
}

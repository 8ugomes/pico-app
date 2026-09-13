'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PhotoUpload, removePhoto } from './Media';
import { useMutation, MutationNotice } from './useMutation';
import { notifyProfileChanged } from '@/lib/profile-events';
export function AvatarEditor({currentPath,onChange,onBusy,expanded=false}:{currentPath:string|null;onChange:()=>void;onBusy?:(busy:boolean)=>void;expanded?:boolean}) {
  const [path,setPath]=useState<string|null>(null), [uploading,setUploading]=useState(false);
  const mutation=useMutation();
  const [cleanup,setCleanup]=useState(false);
  useEffect(() => { onBusy?.(uploading || mutation.busy || path !== null); }, [uploading, mutation.busy, path, onBusy]);
  async function save(next:string|null) {
    if(await mutation.run({action:'set_avatar',path:next},next?'Foto de perfil atualizada.':'Foto de perfil removida.')) {
      setPath(null);notifyProfileChanged();onChange();
      if(currentPath) {try {await removePhoto('avatars',currentPath);}catch {setCleanup(true);}}
    }
  }
  const controls = <><p className="form-note">Escolha, recorte e confirme em “Usar esta foto”. Depois, salve os outros dados do perfil.</p><PhotoUpload bucket="avatars" path={path} onChange={setPath} onBusy={setUploading} /><div className="read-message-actions"><Button disabled={!path || uploading || mutation.busy} onClick={()=>save(path)}>Usar esta foto</Button>{currentPath && <Button variant="quiet" disabled={uploading || mutation.busy} onClick={()=>save(null)}>Remover foto atual</Button>}</div><MutationNotice message={mutation.message} />{cleanup && <p role="status" className="form-note">O perfil foi atualizado. Remova a foto antiga em Privacidade e conta.</p>}</>;
  return expanded ? <div className="profile-setup-photo-controls">{controls}</div> : <details className="connected-panel"><summary>Alterar foto</summary>{controls}</details>;
}

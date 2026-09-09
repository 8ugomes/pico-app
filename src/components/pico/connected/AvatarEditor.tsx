'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PhotoUpload, removePhoto } from './Media';
import { useMutation, MutationNotice } from './useMutation';
export function AvatarEditor({currentPath,onChange}:{currentPath:string|null;onChange:()=>void}) {
  const [path,setPath]=useState<string|null>(null), [uploading,setUploading]=useState(false);
  const mutation=useMutation();
  const [cleanup,setCleanup]=useState(false);
  async function save(next:string|null) {
    if(await mutation.run({action:'set_avatar',path:next},next?'Foto de perfil atualizada.':'Foto de perfil removida.')) {
      setPath(null);onChange();
      if(currentPath) {try {await removePhoto('avatars',currentPath);}catch {setCleanup(true);}}
    }
  }
  return <details className="connected-panel"><summary>Editar foto de perfil</summary><PhotoUpload bucket="avatars" path={path} onChange={setPath} onBusy={setUploading} /><div className="read-message-actions"><Button disabled={!path || uploading || mutation.busy} onClick={()=>save(path)}>Usar esta foto</Button>{currentPath && <Button variant="quiet" disabled={uploading || mutation.busy} onClick={()=>save(null)}>Remover foto atual</Button>}</div><MutationNotice message={mutation.message} />{cleanup && <p role="status" className="form-note">O perfil foi atualizado. Remova a foto antiga em Privacidade e conta.</p>}</details>;
}

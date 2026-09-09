'use client';
import Image from 'next/image';
import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mediaUrl, type MediaBucket } from '@/lib/supabase/media';

export function RemoteAvatar({ src, name }: { src: string | null; name: string }) {
  return <span className="read-profile-avatar">{src ? <Image unoptimized src={src} width={80} height={80} alt={`Foto de ${name}`} /> : <UserRound size={32} aria-label="Perfil sem foto" />}</span>;
}
export async function removePhoto(bucket: MediaBucket,path: string) {
  const response=await fetch('/api/media',{method:'DELETE',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify({bucket,path}),signal:AbortSignal.timeout(30000)});
  const body=await response.json();
  if (!response.ok) throw new Error(body.message || 'Não foi possível remover a foto.');
}
export function PhotoUpload({ bucket, path, onChange, onBusy }: { bucket: MediaBucket; path: string | null; onChange:(path:string|null)=>void; onBusy?:(busy:boolean)=>void }) {
  const [busy,setBusy]=useState(false), [error,setError]=useState<string|null>(null);
  const source=mediaUrl(bucket,path);
  return <div className="photo-upload"><label className="input-group">{bucket==='avatars'?'Foto de perfil':'Foto da publicação (opcional)'}
    <input className="input" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || Boolean(path)} onChange={async e=>{
      const file=e.target.files?.[0]; e.target.value=''; if (!file) return;
      setError(null);
      if (file.size > 3*1024*1024) { setError('Escolha uma foto de até 3 MB.'); return; }
      setBusy(true); onBusy?.(true);
      try {
        const response=await fetch(`/api/media?bucket=${bucket}`,{method:'POST',headers:{'Content-Type':file.type},body:file,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(45000)});
        const result=await response.json();
        if (!response.ok || result.status!=='success') throw new Error(result.message || 'Não foi possível enviar a foto.');
        onChange(result.data.path);
      } catch (failure) { setError(failure instanceof Error && failure.name!=='TimeoutError'?failure.message:'Não foi possível confirmar o envio. Confira suas fotos em Privacidade e conta antes de tentar novamente.'); }
      finally { setBusy(false); onBusy?.(false); }
    }} /><span className="input-hint">JPG, PNG ou WebP, até 3 MB. Envie apenas fotos que você pode compartilhar.</span></label>
    {busy && <p role="status" className="form-note">Enviando foto…</p>}
    {source && <><Image className="upload-preview" unoptimized src={source} alt="Foto selecionada" width={400} height={300} /><Button type="button" variant="quiet" disabled={busy} onClick={async()=>{
      if (!path) return; setBusy(true); onBusy?.(true); setError(null);
      try { await removePhoto(bucket,path); onChange(null); } catch(failure) {setError(failure instanceof Error?failure.message:'Não foi possível remover.');} finally {setBusy(false);onBusy?.(false);}
    }}>Remover foto selecionada</Button></>}
    {error && <p role="alert" className="auth-notice notice-error">{error}</p>}
  </div>;
}

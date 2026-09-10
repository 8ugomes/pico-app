'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mediaUrl, type MediaBucket } from '@/lib/supabase/media';

const PhotoCropper = dynamic(() => import('../photos/PhotoCropper'), { ssr: false, loading: () => <p role="status">Abrindo editor de foto…</p> });
type PhotoSource = { url: string; width: number; height: number };

export function RemoteAvatar({ src, name }: { src: string | null; name: string }) {
  return <span className="read-profile-avatar">{src ? <Image unoptimized src={src} width={80} height={80} alt={`Foto de ${name}`} /> : <UserRound size={32} aria-label="Perfil sem foto" />}</span>;
}

export async function removePhoto(bucket: MediaBucket, path: string) {
  const response = await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store', body: JSON.stringify({ bucket, path }), signal: AbortSignal.timeout(30000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Não foi possível remover a foto.');
}

export function PhotoUpload({ bucket, path, onChange, onBusy, entity, mode }: {
  bucket: MediaBucket;
  path: string | null;
  onChange: (path: string | null) => void;
  onBusy?: (busy: boolean) => void;
  entity?: { kind: 'arena' | 'community'; id: string; slot: 'avatar' | 'cover' };
  mode?: 'avatar' | 'cover' | 'post';
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<PhotoSource | null>(null);
  const objectUrl = useRef<string | null>(null);
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current?.abort(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); };
  }, []);
  const picture = mediaUrl(bucket, path);
  const cropMode = mode || (bucket === 'avatars' ? 'avatar' : 'post');

  function close() {
    operation.current?.abort();
    operation.current = null;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    if (mounted.current) { setSource(null); setBusy(false); onBusy?.(false); }
  }

  async function prepare(file: File) {
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true); onBusy?.(true); setError(null);
    try {
      const { preparePhoto } = await import('@/lib/photos/image');
      const next = await preparePhoto(file, controller.signal);
      if (!mounted.current || controller.signal.aborted) { URL.revokeObjectURL(next.url); return; }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = next.url;
      setSource(next);
    } catch (failure) {
      if (mounted.current && !controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Não foi possível abrir a foto.');
        onBusy?.(false);
      }
    } finally { if (mounted.current && operation.current === controller) setBusy(false); }
  }

  async function confirm(blob: Blob) {
    const controller = operation.current;
    if (!controller || controller.signal.aborted) throw new Error('Selecione a foto novamente.');
    const params = new URLSearchParams({ bucket, ...(entity ? { kind: entity.kind, id: entity.id, slot: entity.slot } : {}) });
    const response = await fetch('/api/media?' + params, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]) });
    const result = await response.json();
    if (!response.ok || result.status !== 'success') throw new Error(result.message || 'Não foi possível enviar a foto. Sua foto anterior foi preservada.');
    if (!mounted.current || controller.signal.aborted) return;
    const previous = path;
    onChange(result.data.path);
    close();
    if (previous) {
      try { await removePhoto(bucket, previous); }
      catch { if (mounted.current) setError('Foto selecionada. Confira imagens sem uso em Privacidade e conta.'); }
    }
  }

  return <div className="photo-upload">
    <label className="input-group">{cropMode === 'avatar' ? 'Foto / avatar' : cropMode === 'cover' ? 'Foto de capa' : 'Foto da publicação (opcional)'}
      <input className="input" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" disabled={busy || Boolean(source)} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void prepare(file); }} />
      <span className="input-hint">JPEG, PNG, WebP e HEIC/HEIF estático. Original até 20 MB e 25 megapixels. A conversão e o recorte acontecem no aparelho antes do envio.</span>
    </label>
    {busy && <p role="status">Preparando foto no aparelho…</p>}
    {picture && <><Image className={`upload-preview ${cropMode === 'avatar' ? 'avatar-preview' : ''}`} unoptimized src={picture} alt="Foto selecionada" width={400} height={cropMode === 'avatar' ? 400 : 300} /><Button type="button" variant="quiet" disabled={busy || Boolean(source)} onClick={async () => {
      if (!path) return;
      setBusy(true); onBusy?.(true);
      try { await removePhoto(bucket, path); if (mounted.current) onChange(null); }
      catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Não foi possível remover.'); }
      finally { if (mounted.current) { setBusy(false); onBusy?.(false); } }
    }}>Remover foto selecionada</Button></>}
    {source && <PhotoCropper source={source} mode={cropMode} onCancel={close} onConfirm={confirm} />}
    {error && <p role="alert" className="auth-notice notice-error">{error}</p>}
  </div>;
}

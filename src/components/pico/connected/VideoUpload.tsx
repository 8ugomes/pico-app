'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { isMp4Header, postVideoUrl, POST_VIDEO_LIMIT } from '@/lib/supabase/post-video';

async function videoAction(body: Record<string, unknown>) {
  const response = await fetch('/api/post-video', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok || !result.data) throw Error(result.message || 'Não foi possível enviar o vídeo.');
  return result.data as { path: string; token?: string };
}

export async function removeVideo(path: string) {
  const response = await fetch('/api/post-video', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }), credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok) throw Error(result.message || 'Não foi possível remover o vídeo.');
}

export function VideoUpload({ path, onChange, onBusy }: { path: string | null; onChange: (path: string | null) => void; onBusy: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [progress, setProgress] = useState('');
  const uploadRef = useRef<{ abort: () => Promise<void>; cancel: () => void } | null>(null);
  useEffect(() => () => {
    const active = uploadRef.current;
    if (active) { active.cancel(); void active.abort().catch(() => {}); }
  }, []);
  const url = postVideoUrl(path);
  return <div className="video-upload">
    <label className="input-group">Vídeo da publicação (opcional)
      <input className="input" type="file" accept="video/mp4,.mp4" disabled={busy} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file || busy) return;
        setError(null);
        if (file.size < 32 || file.size > POST_VIDEO_LIMIT || file.type !== 'video/mp4' || !isMp4Header(new Uint8Array(await file.slice(0, 32).arrayBuffer()))) {
          setError('Escolha um vídeo MP4 válido de até 30 MB.'); return;
        }
        const config = getSupabaseConfig();
        if (!config) { setError('O envio de vídeo está indisponível agora.'); return; }
        setBusy(true); onBusy(true); setProgress('Preparando vídeo…');
        let reservedPath: string | null = null;
        try {
          const reserved = await videoAction({ action: 'reserve', size: file.size });
          reservedPath = reserved.path;
          if (!reserved.token) throw Error('Não foi possível preparar o envio.');
          const { Upload } = await import('tus-js-client');
          const origin = new URL(config.url);
          const endpoint = `${origin.protocol}//${origin.hostname.replace(/\.supabase\.co$/, '.storage.supabase.co')}/storage/v1/upload/resumable/sign`;
          await new Promise<void>((resolve, reject) => {
            const upload = new Upload(file, { endpoint, chunkSize: 6 * 1024 * 1024,
              headers: { 'x-signature': reserved.token!, apikey: config.key },
              metadata: { bucketName: 'post-videos', objectName: reserved.path, contentType: 'video/mp4', cacheControl: '0' },
              retryDelays: [0, 1000, 3000, 5000], uploadDataDuringCreation: true, removeFingerprintOnSuccess: true,
              onProgress(sent, total) { setProgress(`Enviando vídeo… ${Math.round(sent / total * 100)}%`); },
              onError() { reject(Error('Não foi possível enviar o vídeo. Escolha o arquivo novamente para tentar.')); },
              onSuccess() { resolve(); },
            });
            uploadRef.current = { abort: () => upload.abort(), cancel: () => reject(Error('Envio cancelado.')) };
            upload.start();
          });
          uploadRef.current = null;
          setProgress('Conferindo vídeo…');
          const confirmed = await videoAction({ action: 'finalize', path: reserved.path, size: file.size });
          reservedPath = null;
          const previous = path;
          onChange(confirmed.path);
          if (previous && previous !== confirmed.path) {
            try { await removeVideo(previous); }
            catch { setError('O novo vídeo foi selecionado. Remova o anterior em Privacidade e conta.'); }
          }
        } catch (failure) {
          if (reservedPath) {
            try { await removeVideo(reservedPath); } catch { /* The unused reservation remains removable in Conta. */ }
          }
          setError(failure instanceof Error ? failure.message : 'Não foi possível enviar o vídeo.');
        }
        finally { uploadRef.current = null; setBusy(false); onBusy(false); setProgress(''); }
      }} />
      <span className="input-hint">MP4 de até 30 MB. O envio é retomado automaticamente em uma falha breve de rede. O vídeo só aparece para a audiência escolhida após publicar.</span>
    </label>
    {busy && <p role="status">{progress}</p>}
    {url && <><p className="input-hint">Vídeo selecionado. Reproduza para conferir antes de publicar.</p><video className="post-video" controls preload="metadata" playsInline src={url} aria-label="Prévia do vídeo selecionado" /><Button type="button" variant="quiet" disabled={busy} onClick={async () => {
      if (!path) return;
      setBusy(true); onBusy(true); setError(null);
      try { await removeVideo(path); onChange(null); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível remover o vídeo.'); }
      finally { setBusy(false); onBusy(false); }
    }}>Remover vídeo selecionado</Button></>}
    {error && <p className="auth-notice notice-error" role="alert">{error}</p>}
  </div>;
}

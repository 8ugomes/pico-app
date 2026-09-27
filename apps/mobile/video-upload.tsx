import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Video, X } from 'lucide-react';
import type { DetailedError } from 'tus-js-client';
import { api, PicoApiError } from './api';
import { mobileConfig } from './config';
import { Button, Field, errorMessage } from './ui';

const POST_VIDEO_LIMIT = 45 * 1024 * 1024;
const POST_VIDEO_MINIMUM_SIZE = 32;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
const RESERVATION_LIFETIME = 23 * 60 * 60 * 1000;
const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.mp4$/;
const DESCRIPTOR_PREFIX = 'pico:video-upload:v1:';

type UploadTarget = {
  path: string;
  token: string;
  endpoint: string;
  publishableKey: string;
};

type UploadDescriptor = {
  apiOrigin: string;
  createdAt: number;
  path: string;
};

type PreviousUpload = {
  size: number | null;
  metadata: Record<string, string>;
  creationTime: string;
  parallelUploadUrls: string[] | null;
  urlStorageKey: string;
  uploadUrl: string | null;
};

type ActiveUpload = {
  abort: (terminate?: boolean) => Promise<void>;
  descriptorKey: string;
  path: string;
  reject: (error: Error) => void;
};

class UploadCancelled extends Error {}
class UploadPaused extends Error {}
class TusUploadFailure extends Error {}

function storage() {
  try {
    const probe = `${DESCRIPTOR_PREFIX}probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

function readDescriptor(key: string): UploadDescriptor | null {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<UploadDescriptor>;
    if (
      value.apiOrigin !== mobileConfig.apiOrigin
      || typeof value.createdAt !== 'number'
      || Date.now() - value.createdAt > RESERVATION_LIFETIME
      || typeof value.path !== 'string'
      || !PATH_PATTERN.test(value.path)
    ) return null;
    return value as UploadDescriptor;
  } catch {
    return null;
  }
}

function saveDescriptor(key: string, descriptor: UploadDescriptor) {
  try { storage()?.setItem(key, JSON.stringify(descriptor)); } catch { /* TUS still retries during this session. */ }
}

function clearDescriptor(key: string) {
  try { storage()?.removeItem(key); } catch { /* An expired local hint is harmless. */ }
}

async function fileIdentity(file: File, header: Uint8Array) {
  const metadata = new TextEncoder().encode([
    mobileConfig.apiOrigin,
    file.name,
    file.type,
    file.size,
    file.lastModified,
    [...header].map((value) => value.toString(16).padStart(2, '0')).join(''),
  ].join('\u0000'));
  const digest = await crypto.subtle.digest('SHA-256', metadata);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function isPublishableKey(value: string) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  const segments = value.split('.');
  if (segments.length !== 3) return false;
  try {
    const normalized = segments[1].replaceAll('-', '+').replaceAll('_', '/');
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

function validateTarget(value: UploadTarget) {
  if (!PATH_PATTERN.test(value.path) || typeof value.token !== 'string' || value.token.length < 16 || !isPublishableKey(value.publishableKey)) {
    throw new Error('Não foi possível preparar o envio com segurança.');
  }
  let endpoint: URL;
  try { endpoint = new URL(value.endpoint); }
  catch { throw new Error('Não foi possível preparar o envio com segurança.'); }
  if (
    endpoint.protocol !== 'https:'
    || !/^[a-z0-9][a-z0-9-]{2,62}\.storage\.supabase\.co$/.test(endpoint.hostname)
    || endpoint.port
    || endpoint.username
    || endpoint.password
    || endpoint.pathname !== '/storage/v1/upload/resumable/sign'
    || endpoint.search
    || endpoint.hash
  ) {
    throw new Error('Não foi possível preparar o envio com segurança.');
  }
  return endpoint;
}

async function action<T>(body: Record<string, unknown>, method: 'POST' | 'DELETE' = 'POST') {
  return api.request<T>('/video-upload', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function removeMobileVideo(path: string) {
  await action<{ deleted: true }>({ action: 'delete', path }, 'DELETE');
}

function retryableTusFailure(error: DetailedError, retryAttempt: number) {
  if (retryAttempt >= 4 || navigator.onLine === false) return false;
  const status = error.originalResponse?.getStatus() ?? 0;
  return status === 0 || status === 408 || status === 409 || status === 423 || status === 429 || status >= 500;
}

function resumableUpload(
  file: File,
  target: UploadTarget,
  identity: string,
  descriptorKey: string,
  onProgress: (sent: number, total: number) => void,
  onActive: (active: ActiveUpload | null) => void,
) {
  const endpoint = validateTarget(target);
  return import('tus-js-client').then(({ Upload }) => new Promise<void>(async (resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      onActive(null);
      callback();
    };
    const upload = new Upload(file, {
      endpoint: endpoint.href,
      chunkSize: TUS_CHUNK_SIZE,
      retryDelays: [0, 1000, 3000, 5000],
      onShouldRetry: retryableTusFailure,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: true,
      fingerprint: async () => `pico-mobile-video-v1:${target.path}:${identity}`,
      // Signed upload credentials are scoped to one reserved object. Browser
      // cookies and the Pico access token are never forwarded to Storage.
      headers: { 'x-signature': target.token, apikey: target.publishableKey },
      metadata: {
        bucketName: 'post-videos',
        objectName: target.path,
        contentType: 'video/mp4',
        cacheControl: '0',
      },
      onProgress,
      onError: () => finish(() => reject(new TusUploadFailure('O envio foi pausado. Escolha o mesmo MP4 para retomar de onde parou.'))),
      onSuccess: () => finish(resolve),
    });
    onActive({ abort: (terminate = false) => upload.abort(terminate), descriptorKey, path: target.path, reject });
    try {
      const previous = (await upload.findPreviousUploads()) as PreviousUpload[];
      const resumable = previous
        .filter((candidate) => {
          if (
            candidate.size !== file.size
            || candidate.metadata?.bucketName !== 'post-videos'
            || candidate.metadata?.objectName !== target.path
            || !candidate.uploadUrl
          ) return false;
          try {
            const uploadUrl = new URL(candidate.uploadUrl);
            return uploadUrl.origin === endpoint.origin
              && uploadUrl.pathname.startsWith('/storage/v1/upload/resumable/');
          } catch {
            return false;
          }
        })
        .sort((left, right) => Date.parse(right.creationTime) - Date.parse(left.creationTime))[0];
      if (resumable) upload.resumeFromPreviousUpload(resumable);
      upload.start();
    } catch {
      finish(() => reject(new TusUploadFailure('Não foi possível iniciar o envio. Escolha o mesmo MP4 para tentar novamente.')));
    }
  }));
}

export function MobileVideoUpload({
  path,
  onChange,
  onBusy,
  disabled = false,
}: {
  path: string | null;
  onChange: (path: string | null) => void;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [cancellable, setCancellable] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const active = useRef<ActiveUpload | null>(null);
  const mounted = useRef(true);
  const onBusyRef = useRef(onBusy);
  useEffect(() => { onBusyRef.current = onBusy; }, [onBusy]);
  useEffect(() => () => {
    mounted.current = false;
    const current = active.current;
    if (current) {
      current.reject(new UploadPaused('Envio pausado.'));
      void current.abort().catch(() => undefined);
    }
    onBusyRef.current(false);
  }, []);

  const setWorking = (value: boolean) => {
    if (mounted.current) setBusy(value);
    onBusyRef.current(value);
  };

  const discard = async (targetPath: string, descriptorKey?: string) => {
    try { await removeMobileVideo(targetPath); }
    finally { if (descriptorKey) clearDescriptor(descriptorKey); }
  };

  const cancel = async () => {
    const current = active.current;
    if (!current) return;
    active.current = null;
    if (mounted.current) setCancellable(false);
    current.reject(new UploadCancelled('Envio cancelado.'));
    try { await current.abort(true); }
    catch { /* The Bearer cleanup remains authoritative for the reservation. */ }
  };

  const select = async (file: File) => {
    if (busy || disabled) return;
    setMessage('');
    setProgress(0);
    let header = new Uint8Array();
    try {
      header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    } catch { /* The native picker can revoke a temporary file before it is read. */ }
    const validHeader = header.length >= 12
        && header[4] === 0x66
        && header[5] === 0x74
        && header[6] === 0x79
        && header[7] === 0x70;
    if (
      file.size < POST_VIDEO_MINIMUM_SIZE
      || file.size > POST_VIDEO_LIMIT
      || file.type !== 'video/mp4'
      || !/\.mp4$/i.test(file.name)
      || !validHeader
    ) {
      setMessage('Escolha um MP4 válido de até 45 MB. MOV e HEVC não são aceitos nesta versão.');
      return;
    }

    setWorking(true);
    let identity = '';
    let descriptorKey = '';
    let reservedPath: string | null = null;
    let keepForResume = false;
    try {
      identity = await fileIdentity(file, header);
      descriptorKey = `${DESCRIPTOR_PREFIX}${identity}`;
      const descriptor = readDescriptor(descriptorKey);
      reservedPath = descriptor?.path ?? null;
      if (descriptor) {
        try {
          const confirmed = await action<{ path: string }>({ action: 'finalize', path: descriptor.path, size: file.size });
          clearDescriptor(descriptorKey);
          const previous = path;
          onChange(confirmed.path);
          if (previous && previous !== confirmed.path) await removeMobileVideo(previous).catch(() => setMessage('O novo vídeo foi selecionado. Descarte o anterior em Privacidade e conta.'));
          return;
        } catch (error) {
          if (error instanceof PicoApiError && [400, 404, 409, 413, 415].includes(error.status)) {
            await discard(descriptor.path, descriptorKey).catch(() => clearDescriptor(descriptorKey));
            reservedPath = null;
          }
        }
      }

      let target: UploadTarget;
      try {
        target = await action<UploadTarget>({ action: 'reserve', size: file.size, ...(reservedPath ? { path: reservedPath } : {}) });
      } catch (error) {
        if (reservedPath && error instanceof PicoApiError && [400, 403, 404, 409].includes(error.status)) {
          clearDescriptor(descriptorKey);
          reservedPath = null;
          target = await action<UploadTarget>({ action: 'reserve', size: file.size });
        } else {
          throw error;
        }
      }
      validateTarget(target);
      reservedPath = target.path;
      saveDescriptor(descriptorKey, { apiOrigin: mobileConfig.apiOrigin, createdAt: Date.now(), path: target.path });
      keepForResume = true;

      await resumableUpload(
        file,
        target,
        identity,
        descriptorKey,
        (sent, total) => { if (mounted.current) setProgress(total > 0 ? Math.round(sent / total * 100) : 0); },
        (next) => {
          active.current = next;
          if (mounted.current) setCancellable(Boolean(next));
        },
      );
      const confirmed = await action<{ path: string }>({ action: 'finalize', path: target.path, size: file.size });
      keepForResume = false;
      clearDescriptor(descriptorKey);
      const previous = path;
      onChange(confirmed.path);
      if (previous && previous !== confirmed.path) {
        await removeMobileVideo(previous).catch(() => setMessage('O novo vídeo foi selecionado. Descarte o anterior em Privacidade e conta.'));
      }
    } catch (error) {
      if (error instanceof UploadPaused) return;
      if (error instanceof UploadCancelled) {
        keepForResume = false;
        if (reservedPath) await discard(reservedPath, descriptorKey).catch(() => clearDescriptor(descriptorKey));
        if (mounted.current) setMessage('Envio cancelado. Nenhum vídeo foi publicado.');
      } else {
        const recoverable = error instanceof TusUploadFailure
          || (error instanceof PicoApiError && (error.status === 0 || error.status >= 500));
        if (!recoverable && reservedPath) {
          keepForResume = false;
          await discard(reservedPath, descriptorKey).catch(() => clearDescriptor(descriptorKey));
        }
        if (mounted.current) setMessage(recoverable
          ? 'O envio ficou pausado. Escolha o mesmo MP4 para retomar de onde parou.'
          : errorMessage(error));
      }
    } finally {
      active.current = null;
      if (descriptorKey && !keepForResume && reservedPath) clearDescriptor(descriptorKey);
      if (mounted.current) {
        setCancellable(false);
        setProgress(0);
        setWorking(false);
      }
    }
  };

  return <div className="video-upload">
    <Field label="Vídeo da publicação (opcional)" hint="MP4 de até 45 MB. MOV e HEVC não são aceitos nesta versão.">
      <input
        type="file"
        accept="video/mp4,.mp4"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void select(file);
        }}
      />
    </Field>
    {busy && <div className="state-line" role="status" aria-live="polite">
      <LoaderCircle className="spinner" size={18} aria-hidden="true" />
      <span>{progress > 0 ? `Enviando vídeo… ${progress}%` : 'Preparando vídeo…'}</span>
      {cancellable && <Button type="button" variant="quiet" onClick={() => void cancel()}><X size={17} aria-hidden="true" />Cancelar</Button>}
    </div>}
    {path && !busy && <div className="compose-tools">
      <span><Video size={18} aria-hidden="true" /> Vídeo selecionado</span>
      <Button type="button" variant="quiet" disabled={disabled} onClick={async () => {
        setWorking(true);
        setMessage('');
        try { await removeMobileVideo(path); onChange(null); }
        catch (error) { setMessage(errorMessage(error)); }
        finally { setWorking(false); }
      }}>Remover vídeo</Button>
    </div>}
    {message && <p className="notice notice-warning" role="alert">{message}</p>}
  </div>;
}

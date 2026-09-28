'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Copy, LoaderCircle, QrCode, Share2 } from 'lucide-react';
import type { ShareTarget } from '@/lib/sharing/targets';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type PreparedShare = { title: string; url: string };
type ShareNotice = { kind: 'status' | 'error'; text: string } | null;

class ShareRequestError extends Error {}

export function ShareActions({ target, label = 'Compartilhar' }: { target: ShareTarget; label?: string }) {
  const [open, setOpen] = useState(false);
  const [prepared, setPrepared] = useState<PreparedShare | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<ShareNotice>(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');
  const [qrBusy, setQrBusy] = useState(false);
  const requestId = useRef(0);
  const qrRequestId = useRef(0);

  async function prepare() {
    const request = ++requestId.current;
    qrRequestId.current += 1;
    setOpen(true); setPrepared(null); setError(''); setNotice(null); setQr(''); setQrBusy(false); setBusy(true);
    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(target),
        signal: AbortSignal.timeout(15000),
      });
      let body: unknown;
      try { body = await response.json(); } catch { body = null; }
      const value = body && typeof body === 'object' ? body as Record<string, unknown> : null;
      if (!response.ok) throw new ShareRequestError(typeof value?.message === 'string' ? value.message : 'Não foi possível preparar o link.');
      const data = value?.data && typeof value.data === 'object' ? value.data as Record<string, unknown> : null;
      if (typeof data?.title !== 'string' || typeof data.url !== 'string') throw new Error('invalid_response');
      if (request === requestId.current) setPrepared({ title: data.title, url: data.url });
    } catch (value) {
      if (request === requestId.current) setError(value instanceof ShareRequestError
        ? value.message
        : value instanceof DOMException && value.name === 'TimeoutError'
          ? 'O link demorou para ficar pronto. Tente novamente.'
          : 'Não foi possível preparar o link. Confira sua conexão e tente novamente.');
    } finally { if (request === requestId.current) setBusy(false); }
  }

  async function copy() {
    if (!prepared) return;
    setNotice(null);
    try {
      await navigator.clipboard.writeText(prepared.url);
      setNotice({ kind: 'status', text: 'Link copiado.' });
    } catch {
      setNotice({ kind: 'status', text: 'Selecione e copie o endereço abaixo.' });
    }
  }

  async function nativeShare() {
    if (!prepared || !navigator.share) return;
    setNotice(null);
    try {
      await navigator.share({ title: prepared.title, url: prepared.url });
      setNotice({ kind: 'status', text: 'Compartilhamento encerrado. O Pico não presume que houve envio.' });
    } catch (value) {
      if (!(value instanceof DOMException && value.name === 'AbortError')) setNotice({ kind: 'error', text: 'Não foi possível abrir o compartilhamento. O link continua disponível.' });
    }
  }

  async function showQr() {
    if (!prepared || qrBusy) return;
    if (qr) { qrRequestId.current += 1; setQr(''); return; }
    const request = ++qrRequestId.current;
    const url = prepared.url;
    setNotice(null);
    setQrBusy(true);
    try {
      const QRCode = await import('qrcode');
      const image = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 4, width: 320, color: { dark: '#382b28', light: '#fffaf0' } });
      if (request === qrRequestId.current) setQr(image);
    } catch {
      if (request === qrRequestId.current) setNotice({ kind: 'error', text: 'Não foi possível gerar o QR agora. O link continua disponível.' });
    } finally { if (request === qrRequestId.current) setQrBusy(false); }
  }

  function close() {
    requestId.current += 1;
    qrRequestId.current += 1;
    setOpen(false); setPrepared(null); setError(''); setNotice(null); setBusy(false); setQr(''); setQrBusy(false);
  }

  return <>
    <Button size="small" variant="secondary" onClick={prepare}><Share2 size={16} aria-hidden="true" />{label}</Button>
    <Modal open={open} onClose={close} title="Compartilhar no seu contexto">
      <p>O link leva a esta tela do Pico. Abrir não acompanha ninguém, não entra em comunidade e não aceita convite.</p>
      {busy && <p className="share-status" role="status"><LoaderCircle className="spinner" size={18} aria-hidden="true" />Preparando link seguro…</p>}
      {error && <div className="read-message"><p role="alert">{error}</p><Button size="small" variant="secondary" onClick={prepare}>Tentar novamente</Button></div>}
      {prepared && <>
        <label className="input-group">Endereço<input className="input" readOnly value={prepared.url} onFocus={event => event.currentTarget.select()} /></label>
        <div className="share-actions">
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <Button onClick={nativeShare}><Share2 size={17} aria-hidden="true" />Abrir compartilhamento</Button>}
          <Button variant="secondary" onClick={copy}><Copy size={17} aria-hidden="true" />Copiar link</Button>
          <Button variant="quiet" disabled={qrBusy} aria-expanded={Boolean(qr)} onClick={showQr}>{qrBusy ? <LoaderCircle className="spinner" size={17} aria-hidden="true" /> : <QrCode size={17} aria-hidden="true" />}{qrBusy ? 'Gerando QR…' : qr ? 'Ocultar QR' : 'Mostrar QR'}</Button>
        </div>
        {qr && <figure className="share-qr"><Image unoptimized src={qr} width={320} height={320} alt={`QR code para ${prepared.title}`} /><figcaption>QR gerado neste aparelho, sem serviço externo.</figcaption></figure>}
        {notice && <p className="share-status" role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.kind === 'status' && <Check size={16} aria-hidden="true" />}{notice.text}</p>}
      </>}
    </Modal>
  </>;
}

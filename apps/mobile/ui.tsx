/* eslint-disable @next/next/no-img-element */
import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, ImageOff, LoaderCircle, RotateCw, X } from 'lucide-react';
import { api } from './api';

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  return <button className={`button button-${variant} ${className}`.trim()} {...props}>{children}</button>;
}

export function IconButton({ label, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button className={`icon-button ${className}`.trim()} aria-label={label} title={label} {...props}>{children}</button>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const hintId = useId();
  const control = hint ? describeControls(children, hintId) : children;
  return <label className="field"><span>{label}</span>{control}{hint && <small id={hintId}>{hint}</small>}</label>;
}

type DescribedElementProps = { 'aria-describedby'?: string; children?: ReactNode };

function describeControls(node: ReactNode, hintId: string): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<DescribedElementProps>(child) || typeof child.type !== 'string') return child;
    if (child.type === 'input' || child.type === 'textarea' || child.type === 'select') {
      const describedBy = [child.props['aria-describedby'], hintId].filter(Boolean).join(' ');
      return cloneElement(child, { 'aria-describedby': describedBy });
    }
    if (!child.props.children) return child;
    return cloneElement(child, { children: describeControls(child.props.children, hintId) });
  });
}

export function LoadingState({ children = 'Carregando…' }: { children?: ReactNode }) {
  return <div className="state-line" role="status"><LoaderCircle className="spinner" size={18} aria-hidden="true" />{children}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <section className="message-state message-error" role="alert"><AlertCircle size={22} aria-hidden="true" /><div><strong>Não deu certo agora.</strong><p>{message}</p>{onRetry && <Button variant="quiet" onClick={onRetry}><RotateCw size={17} aria-hidden="true" />Tentar de novo</Button>}</div></section>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <section className="message-state"><div><strong>{title}</strong><p>{children}</p></div></section>;
}

export function OfflineNotice() {
  return <div className="offline-notice" role="status">Sem conexão. Ações de envio estão indisponíveis. Rascunhos de publicação, perfil e jogo ficam guardados neste aparelho.</div>;
}

export function Avatar({ src, name, size = 'medium' }: { src: string | null | undefined; name: string; size?: 'small' | 'medium' | 'large' }) {
  return <span className={`avatar avatar-${size}`} aria-label={`Foto de ${name}`}>
    {src ? <PrivateImage src={src} alt="" /> : <span aria-hidden="true">{initials(name)}</span>}
  </span>;
}

export function PrivateImage({ src, alt, className = '', ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const privatePath = src.startsWith('/api/media') || src.includes('/api/media?');
  const [state, setState] = useState<{ source: string; url: string | null; failed: boolean }>({ source: '', url: null, failed: false });
  useEffect(() => {
    if (!privatePath) return;
    let active = true;
    let objectUrl = '';
    void api.privateMedia(src).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setState({ source: src, url: objectUrl, failed: false });
    }).catch(() => {
      if (active) setState({ source: src, url: null, failed: true });
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [privatePath, src]);
  if (!privatePath) return <img src={src} alt={alt} className={className} loading="lazy" {...props} />;
  if (state.source === src && state.failed) return <span className={`image-fallback ${className}`} role="img" aria-label={alt || 'Foto indisponível'}><ImageOff size={20} aria-hidden="true" /></span>;
  if (state.source !== src || !state.url) return <span className={`image-loading ${className}`} role="status" aria-label="Carregando foto" />;
  return <img src={state.url} alt={alt} className={className} loading="lazy" {...props} />;
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const sheet = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add('modal-open');
    const frame = requestAnimationFrame(() => {
      const preferred = sheet.current?.querySelector<HTMLElement>('[autofocus], input, textarea, select, button');
      preferred?.focus({ preventScroll: true });
    });
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== 'Tab' || !sheet.current) return;
      const focusable = [...sheet.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keydown);
      document.documentElement.classList.remove('modal-open');
      requestAnimationFrame(() => previous?.focus());
    };
  }, [open]);
  if (!open) return null;
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section ref={sheet} className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header><h2 id="modal-title">{title}</h2><IconButton label="Fechar" onClick={onClose}><X size={21} aria-hidden="true" /></IconButton></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'success' | 'warning'; children: ReactNode }) {
  return <p className={`notice notice-${tone}`} role="status">{children}</p>;
}

export function dateLabel(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('pt-BR') || '').join('') || 'P';
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir agora. Tente de novo.';
}

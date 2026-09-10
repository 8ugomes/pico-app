"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const controlledClosures = useRef(0);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const origin = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) { controlledClosures.current += 1; dialog.close(); }
      if (origin instanceof HTMLElement && origin.isConnected && origin !== document.body && !origin.matches(':disabled')) {
        origin.focus({ preventScroll: true });
      } else {
        // A nested photo dialog can unmount while its file input is disabled.
        // Keep focus inside the remaining native dialog until that control is ready.
        const parent = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);
        parent?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')?.focus({ preventScroll: true });
      }
    };
  }, [open]);
  return <dialog onKeyDown={e => {
    if (e.key !== 'Tab' || (e.target as Element).closest('dialog') !== e.currentTarget) return;
    const controls = [...e.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]')]
      .filter(control => control.tabIndex >= 0 && !control.matches(':disabled') && control.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }} className="pico-dialog" ref={ref} aria-labelledby={titleId} onClose={e => { e.stopPropagation(); if (controlledClosures.current) controlledClosures.current -= 1; else onClose(); }} onCancel={e => { e.preventDefault(); e.stopPropagation(); onClose(); }} onClick={e => {
    if (e.target !== e.currentTarget) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) onClose();
  }}>
    <header className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
    <div className="dialog-body">{children}</div>
  </dialog>;
}

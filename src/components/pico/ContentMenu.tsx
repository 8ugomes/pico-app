'use client';
import { useState, type ReactNode } from 'react';
import { Ellipsis } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export type ContentMenuItem = { label: string; icon: ReactNode; onSelect: () => void; destructive?: boolean };

export function ContentMenu({ label, items }: { label: string; items: ContentMenuItem[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return <>
    <button type="button" className="icon-button content-menu-trigger" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Ellipsis size={23} aria-hidden="true" /></button>
    <Modal open={open} onClose={() => setOpen(false)} title={label}>
      <div className="content-menu-list">{items.map(item => <button type="button" className={`content-menu-item${item.destructive ? ' content-menu-danger' : ''}`} key={item.label} onClick={() => { setOpen(false); item.onSelect(); }}>{item.icon}<span>{item.label}</span></button>)}</div>
    </Modal>
  </>;
}

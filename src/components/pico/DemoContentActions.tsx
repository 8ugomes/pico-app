'use client';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ContentMenu } from './ContentMenu';
import { useDemo } from './DemoProvider';

export function DemoContentActions({ target, id, body, authorId, name }: { target: 'post' | 'comment'; id: string; body: string; authorId: string; name: string }) {
  const { me, dispatch } = useDemo();
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const [draft, setDraft] = useState(body);
  if (authorId !== me.id) return null;
  const noun = target === 'post' ? 'publicação' : 'comentário';
  return <>
    <ContentMenu label={`Opções ${target === 'post' ? 'da' : 'do'} ${noun} de ${name}`} items={[
      { label: `Editar ${noun}`, icon: <Pencil size={19} aria-hidden="true" />, onSelect: () => { setDraft(body); setMode('edit'); } },
      { label: `Excluir ${noun}`, icon: <Trash2 size={19} aria-hidden="true" />, destructive: true, onSelect: () => setMode('delete') },
    ]} />
    <Modal open={mode !== null} onClose={() => setMode(null)} title={`${mode === 'edit' ? 'Editar' : 'Excluir'} ${noun}`}>
      <p className="form-note">Demonstração: alteração somente nesta sessão.</p>
      {mode === 'edit' ? <form className="connected-form" onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; dispatch({type:'edit_content',target,id,content:draft}); setMode(null); }}>
        <label className="input-group">{target === 'comment' ? 'Comentário' : 'Texto'}<textarea data-dialog-autofocus className="input" value={draft} onChange={e => setDraft(e.target.value)} maxLength={target === 'post' ? 500 : 280} rows={4} required /></label>
        <div className="content-edit-actions"><Button type="button" variant="secondary" onClick={() => setMode(null)}>Cancelar</Button><Button type="submit" disabled={!draft.trim() || draft.trim() === body}>Salvar alteração</Button></div>
      </form> : <div className="content-edit-actions"><Button variant="secondary" onClick={() => setMode(null)}>Cancelar</Button><Button onClick={() => { dispatch({type:'delete_content',target,id}); setMode(null); }}>Excluir nesta sessão</Button></div>}
    </Modal>
  </>;
}

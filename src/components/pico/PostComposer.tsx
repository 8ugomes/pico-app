"use client";
import { useState, type FormEvent } from "react";
import { Plus, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDemo } from "./DemoProvider";
import { PlayerAvatar } from "./PlayerAvatar";
import { validatePost } from "@/lib/demo-state";
import type { SportId } from "@/types/social";

export function PostComposer({ fixedArenaId }: { fixedArenaId?: string }) {
  const { state, dispatch, now, me } = useDemo();
  const [open, setOpen] = useState(false);
  const [arenaId, setArenaId] = useState(fixedArenaId ?? state.arenas[0].id);
  const arena = state.arenas.find(a => a.id === arenaId)!;
  const [sportId, setSportId] = useState<SportId>(arena.sports[0]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    const input = { arenaId, sportId, content };
    const invalid = validatePost(state, input);
    if (invalid) { setError(invalid); return; }
    dispatch({ type: "post", input, id: crypto.randomUUID(), now });
    setContent(""); setError(""); setOpen(false); setNotice("Post publicado na demonstração.");
  }
  return <>
    <button type="button" className="composer-trigger" onClick={() => { setNotice(""); setOpen(true); }}><PlayerAvatar player={me} size="small" /><span>O que tá rolando na areia?</span><Plus size={20} aria-hidden="true" /></button>
    {notice && <p className="inline-success" role="status">{notice}</p>}
    <Modal open={open} onClose={() => setOpen(false)} title="Posta no Pico">
      <form onSubmit={submit} className="social-form">
        <label>Seu encontro na areia<textarea value={content} onChange={e => setContent(e.target.value)} maxLength={500} rows={4} placeholder="Chame a turma, encontre uma dupla ou conte como foi o jogo." required /></label>
        <span className="form-count">{content.length}/500</span>
        <div className="form-columns">
          <label>Arena<select value={arenaId} disabled={Boolean(fixedArenaId)} onChange={e => { const next = state.arenas.find(a => a.id === e.target.value)!; setArenaId(next.id); setSportId(next.sports[0]); }}>{state.arenas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label>Esporte<select value={sportId} onChange={e => setSportId(e.target.value as SportId)}>{arena.sports.map(id => <option key={id} value={id}>{state.sports.find(s => s.id === id)?.name}</option>)}</select></label>
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
        <p className="form-note">Visível apenas nesta sessão de demonstração.</p>
        <Button type="submit" disabled={!content.trim()}>Publicar <Send size={17} aria-hidden="true" /></Button>
      </form>
    </Modal>
  </>;
}

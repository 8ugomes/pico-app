'use client';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export function AccountExport() {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef(false);
  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    const form = event.currentTarget;
    try {
      const response = await fetch('/api/account/export', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: new FormData(form).get('password') }), signal: AbortSignal.timeout(30000) });
      if (!response.ok) { const result = await response.json(); throw Error(result.message || 'Não foi possível preparar o arquivo.'); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      // Keep download activation inside the dialog that received the action.
      link.href = url; link.download = 'meus-dados-pico.json'; form.append(link); link.click(); link.remove();
      // Keep the object URL alive while the browser starts its download.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      form.reset(); setOpen(false);
    } catch (failure) {
      setError(failure instanceof TypeError || (failure instanceof Error && ['TimeoutError', 'AbortError'].includes(failure.name)) ? 'Não foi possível baixar agora. Confira sua conexão e tente novamente.' : failure instanceof Error ? failure.message : 'Não foi possível baixar agora.');
    } finally { pending.current = false; setBusy(false); }
  }
  return <section className="connected-panel"><h2>Baixar meus dados</h2><p className="form-note">Um arquivo com seu perfil, publicações, interações e registros privados. Inclui as referências das fotos, sem os arquivos de imagem. Guarde em um lugar seguro.</p><Button variant="quiet" onClick={() => { setError(''); setOpen(true); }}>Baixar meus dados</Button>
    <Modal open={open} onClose={() => { if (!pending.current) setOpen(false); }} title="Baixar seus dados"><p className="form-note">Confirme sua senha para preparar o arquivo JSON. Ele contém dados pessoais e não inclui sua senha.</p><form className="connected-form" onSubmit={download}><fieldset disabled={busy}><Input id="export-password" name="password" type="password" label="Sua senha atual" autoComplete="current-password" minLength={1} maxLength={128} required /><Button type="submit">{busy ? 'Preparando…' : 'Baixar arquivo'}</Button></fieldset>{error && <p role="alert" className="auth-notice notice-error">{error}</p>}</form></Modal>
  </section>;
}

'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function RecoveryForm({ reset = false }: { reset?: boolean }) {
  const [client] = useState(createClient);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState<{error:boolean;text:string}|null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!client || busy) return;
    const form=e.currentTarget, data=new FormData(form);
    setBusy(true); setNotice(null);
    try {
      if (reset) {
        if (data.get('password') !== data.get('confirm')) { setNotice({error:true,text:'As senhas precisam ser iguais.'}); return; }
        const identity=await client.auth.getUser();
        if (!identity.data.user) { setNotice({error:true,text:'Abra o link mais recente de recuperação neste navegador.'}); return; }
        const result=await client.auth.updateUser({password:String(data.get('password'))});
        if (result.error) { setNotice({error:true,text:'Não foi possível alterar a senha. Use uma senha diferente e mais forte ou peça um novo link.'}); return; }
        await client.auth.signOut();
        window.location.replace('/login?password=updated');
      } else {
        const result=await client.auth.resetPasswordForEmail(String(data.get('email')).trim(),{redirectTo:new URL(process.env.NEXT_PUBLIC_PICO_EMAIL_TEMPLATES === 'custom' ? '/auth/confirm' : '/auth/callback',location.origin).href});
        if (result.error) { setNotice({error:true,text:'Não foi possível enviar agora. Aguarde alguns minutos e tente novamente.'}); return; }
        setNotice({error:false,text:'Se houver uma conta para esse e-mail, você receberá um link. Abra o link no mesmo navegador em que você fez o pedido. Confira também o spam.'});
        form.reset();
      }
    } catch { setNotice({error:true,text:'Confira sua conexão e tente novamente.'}); }
    finally { setBusy(false); }
  }
  return <><form className="auth-form" onSubmit={submit}><fieldset disabled={busy || !client}>
    {reset ? <><Input id="password" name="password" label="Nova senha" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /><Input id="confirm" name="confirm" label="Repita a nova senha" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></> : <Input id="email" name="email" label="E-mail da sua conta" type="email" autoComplete="email" maxLength={254} required />}
    <Button type="submit">{busy ? 'Aguarde…' : reset ? 'Salvar nova senha' : 'Enviar link'}</Button>
  </fieldset>{notice && <p role={notice.error?'alert':'status'} className={`auth-notice notice-${notice.error?'error':'success'}`}>{notice.text}</p>}
  {!client && <p role="status" className="form-note">O acesso às contas está indisponível nesta versão.</p>}</form><p className="auth-switch"><Link href="/login">Voltar para entrar</Link></p></>;
}

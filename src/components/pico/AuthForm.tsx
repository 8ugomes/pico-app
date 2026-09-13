"use client";

import { newPasswordError, passwordConfirmationError } from '@/lib/auth/password';
import { afterLogin } from '@/lib/auth/navigation';
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { getSupabaseEnvironment } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SignOutButton } from "./SignOutButton";
import { emailDeliveryEnabled } from '../../../config/auth-policy.json';

type Notice = { kind: "error" | "success"; text: string };
type AuthMode = "login" | "signup";

function authError(code?: string) {
  switch (code) {
    case "hook_error":
    case "hook_payload_invalid_content_type": return "Não foi possível concluir o cadastro agora. Tente novamente mais tarde.";
    case "invalid_credentials": return "E-mail ou senha incorretos. Confira e tente novamente.";
    case "email_not_confirmed": return "Confirme seu e-mail antes de entrar. Confira também a caixa de spam.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "Muitas tentativas por agora. Aguarde um pouco e tente novamente.";
    case "weak_password": return "Escolha uma senha mais forte, com letras, números e símbolos.";
    case "user_already_exists": return "Não foi possível criar a conta. Tente entrar com seu e-mail.";
    default: return "Não foi possível continuar agora. Confira sua conexão e tente novamente.";
  }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [client] = useState(createClient);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [checking, setChecking] = useState(Boolean(client));
  const [email, setEmail] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const signup = mode === "signup";

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    client.auth.getUser().then(({ data }) => {
      if (mounted) { setEmail(data.user?.email ?? null); setChecking(false); }
    }).catch(() => { if (mounted) setChecking(false); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setEmail(session?.user.email ?? null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [client]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const address = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    if (signup && name.length < 2) {
      setNotice({ kind: "error", text: "Conte como você quer ser chamado, com pelo menos 2 caracteres." });
      return;
    }
    if (signup) {
      const error = newPasswordError(password);
      const confirmation = passwordConfirmationError(password, String(data.get('password-confirm') ?? ''));
      setPasswordError(error ?? undefined); setConfirmError(confirmation ?? undefined); setNotice(null);
      if (error || confirmation) {
        (form.elements.namedItem(error ? 'password' : 'password-confirm') as HTMLInputElement)?.focus();
        return;
      }
    }
    setBusy(true);
    setNotice(null);
    try {
      const { data: result, error } = signup
        ? await client.auth.signUp({
            email: address,
            password,
            options: { data: { display_name: name }, emailRedirectTo: new URL(process.env.NEXT_PUBLIC_PICO_EMAIL_TEMPLATES === "custom" ? "/auth/confirm" : "/auth/callback", window.location.origin).href },
          })
        : await client.auth.signInWithPassword({ email: address, password });
      if (error) { if (error.code === "email_not_confirmed") setConfirmationEmail(address); setNotice({ kind: "error", text: authError(error.code) }); return; }
      if (result.session) {
        setEmail(result.user?.email ?? address);
        router.replace(afterLogin());
        router.refresh();
      } else {
        setConfirmationEmail(address);
        setNotice({ kind: "success", text: "Confira seu e-mail para continuar. Se o cadastro puder ser concluído, você receberá um link de confirmação. Abra o link no mesmo navegador em que você fez o pedido." });
      }
      form.reset();
    } catch {
      setNotice({ kind: "error", text: authError() });
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!client || !confirmationEmail || busy || !emailDeliveryEnabled) return;
    setBusy(true); setNotice(null);
    try {
      const { error } = await client.auth.resend({ type: 'signup', email: confirmationEmail, options: { emailRedirectTo: new URL(process.env.NEXT_PUBLIC_PICO_EMAIL_TEMPLATES === 'custom' ? '/auth/confirm' : '/auth/callback', location.origin).href } });
      setNotice(error ? { kind: 'error', text: authError(error.code) } : { kind: 'success', text: 'Se houver um cadastro aguardando confirmação, você receberá um novo link. Confira também o spam.' });
    } catch { setNotice({ kind: 'error', text: authError() }); }
    finally { setBusy(false); }
  }

  if (checking) return <p className="auth-notice" role="status"><LoaderCircle size={18} className="spinner" aria-hidden="true" /> Conferindo seu acesso…</p>;

  if (email) return (
    <div className="auth-success">
      <span className="success-icon"><Check size={24} aria-hidden="true" /></span>
      <h2>Você entrou no Pico.</h2>
      <p>Sessão iniciada com <strong>{email}</strong>.</p>

      <Link className={buttonVariants()} href="/perfil">Ver meu perfil <ArrowUpRight size={18} aria-hidden="true" /></Link>
      <SignOutButton />
      {notice && <p className="auth-notice notice-error" role="alert">{notice.text}</p>}
    </div>
  );

  return (
    <>
      {!client && <p className="auth-notice" id="auth-availability" role="status">{getSupabaseEnvironment().status === "invalid" ? "O acesso às contas está indisponível agora. Tente novamente mais tarde." : `O Pico está em demonstração. ${signup ? "A criação de contas" : "O acesso às contas"} ainda não está disponível nesta versão.`}</p>}
      <form onSubmit={submit} className="auth-form" aria-describedby={!client ? "auth-availability" : undefined}>
        <fieldset disabled={!client || busy}>
          {signup && <Input id="name" name="name" label="Como você quer ser chamado?" placeholder="Seu nome" autoComplete="nickname" minLength={2} maxLength={60} required />}
          <Input id="email" name="email" label="E-mail" placeholder="voce@exemplo.com" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required />
          <PasswordInput id="password" name="password" label="Senha" placeholder={signup ? "Crie sua senha" : "Sua senha"} autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : undefined} maxLength={128} hint={signup ? "Pelo menos 12 caracteres." : undefined} error={passwordError} onChange={() => { setPasswordError(undefined); setConfirmError(undefined); }} required />
          {signup && <PasswordInput id="password-confirm" name="password-confirm" label="Confirmar senha" placeholder="Repita sua senha" autoComplete="new-password" maxLength={128} error={confirmError} onChange={() => setConfirmError(undefined)} required />}
          <Button type="submit" size="large" className="auth-submit">
            {busy ? <><LoaderCircle size={18} className="spinner" aria-hidden="true" /> {signup ? "Criando conta…" : "Entrando…"}</> : <>{signup ? "Criar conta" : "Entrar"} <ArrowUpRight size={18} aria-hidden="true" /></>}
          </Button>
        </fieldset>
        {notice && <p className={`auth-notice notice-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>}
      </form>
      {signup && !emailDeliveryEnabled && <p className="form-note">Recuperação por e-mail indisponível nesta beta. Guarde sua senha.</p>}
      {confirmationEmail && emailDeliveryEnabled && <Button variant="quiet" disabled={busy} onClick={resendConfirmation}>Reenviar confirmação</Button>}
      <p className="auth-switch">{signup ? "Já tá no Pico?" : "Ainda não tá no Pico?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Entrar" : "Criar conta"}</Link></p>
      <nav className="auth-help" aria-label="Ajuda com sua conta">{!signup && <Link href="/recuperar">Esqueci minha senha</Link>}<Link href="/privacidade">Privacidade</Link></nav>
    </>
  );
}

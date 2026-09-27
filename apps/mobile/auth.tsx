import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, LoaderCircle, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { api } from './api';
import { legalUrls } from './config';
import { openExternal, successHaptic } from './native';
import { Button, ErrorState, Field, Notice } from './ui';

export function AuthScreen({ notice, onAuthenticated, onGuest }: { notice?: string; onAuthenticated: () => void; onGuest: () => void }) {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const email = String(values.get('email') || '');
      const password = String(values.get('password') || '');
      if (mode === 'sign_up') await api.signUp(String(values.get('name') || ''), email, password);
      else await api.signIn(email, password);
      await successHaptic();
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar agora.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-screen" id="main-content">
    <section className="auth-brand" aria-label="Pico Social">
      <PicoMark />
      <p>Futevôlei · beach tennis · vôlei de praia</p>
      <h1>O ponto de encontro da areia.</h1>
    </section>
    <section className="auth-form-panel">
      <div className="segmented" aria-label="Acesso">
        <button type="button" aria-pressed={mode === 'sign_in'} onClick={() => { setMode('sign_in'); setError(''); }}>Entrar</button>
        <button type="button" aria-pressed={mode === 'sign_up'} onClick={() => { setMode('sign_up'); setError(''); }}>Criar conta</button>
      </div>
      <div className="auth-copy"><h2>{mode === 'sign_in' ? 'Bom te ver de novo.' : 'Chega mais.'}</h2><p>{mode === 'sign_in' ? 'Entre para encontrar sua turma e acompanhar a areia.' : 'Crie sua conta e monte o perfil no próximo passo.'}</p></div>
      {notice && <Notice tone="warning">{notice}</Notice>}
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          {mode === 'sign_up' && <Field label="Seu nome"><input name="name" required minLength={2} maxLength={60} autoComplete="name" /></Field>}
          <Field label="E-mail"><input name="email" required type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" /></Field>
          <Field label="Senha" hint={mode === 'sign_up' ? 'Use pelo menos 12 caracteres.' : undefined}><input name="password" required minLength={mode === 'sign_up' ? 12 : 1} maxLength={128} type="password" autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'} /></Field>
          <Button type="submit" disabled={busy} className="full-width">{busy && <LoaderCircle className="spinner" size={18} aria-hidden="true" />}{busy ? 'Só um instante…' : mode === 'sign_in' ? 'Entrar' : 'Criar minha conta'}{!busy && <ArrowRight size={18} aria-hidden="true" />}</Button>
        </fieldset>
      </form>
      {error && <ErrorState message={error} />}
      {mode === 'sign_up' && <Notice>Ao criar a conta, você aceita os <button type="button" className="text-button" onClick={() => void openExternal(legalUrls.terms)}>Termos</button> e as <button type="button" className="text-button" onClick={() => void openExternal(legalUrls.guidelines)}>Diretrizes</button>.</Notice>}
      <div className="guest-entry"><span>Quer conhecer primeiro?</span><Button type="button" variant="secondary" className="full-width" onClick={onGuest}>Ver como o Pico funciona</Button><small>Visita informativa, sem perfis ou conteúdo da comunidade.</small></div>
      <button type="button" className="help-link" onClick={() => void openExternal(legalUrls.support)}>Precisa de ajuda?</button>
    </section>
  </main>;
}

export function GuestScreen({ onExit }: { onExit: () => void }) {
  return <main className="guest-screen" id="main-content">
    <header className="guest-hero"><PicoMark /><span>VISITA SEM CONTA</span><h1>Um jeito rápido de entender o Pico.</h1><p>Esta visita é somente informativa. Ela não consulta perfis, publicações, comunidades, arenas cadastradas nem mostra ações sociais.</p></header>
    <section className="guest-body" aria-labelledby="guest-about-title">
      <button type="button" className="back-button" onClick={onExit}><ArrowLeft size={19} aria-hidden="true" />Entrar ou criar conta</button>
      <h2 id="guest-about-title">O que você encontra depois de entrar</h2>
      <div className="guest-feature"><UsersRound size={22} aria-hidden="true" /><div><h3>Pessoas e comunidades</h3><p>Encontre quem joga suas modalidades e participe de grupos com audiência e regras próprias.</p></div></div>
      <div className="guest-feature"><MapPin size={22} aria-hidden="true" /><div><h3>Arenas</h3><p>Conheça os lugares da sua região sem mapa em tempo real ou indicação de presença.</p></div></div>
      <div className="guest-feature"><CalendarDays size={22} aria-hidden="true" /><div><h3>Jogos só seus</h3><p>Registre partidas depois que acontecerem. Compartilhar é sempre uma ação separada.</p></div></div>
      <div className="guest-feature"><ShieldCheck size={22} aria-hidden="true" /><div><h3>Controle e privacidade</h3><p>Fotos privadas exigem acesso autorizado. Você pode denunciar, bloquear, exportar dados e excluir a conta.</p></div></div>
      <Button className="full-width" onClick={onExit}>Entrar ou criar conta<ArrowRight size={18} aria-hidden="true" /></Button>
      <nav className="guest-links" aria-label="Informações públicas"><button type="button" onClick={() => void openExternal(legalUrls.privacy)}>Privacidade</button><button type="button" onClick={() => void openExternal(legalUrls.terms)}>Termos</button><button type="button" onClick={() => void openExternal(legalUrls.guidelines)}>Diretrizes</button><button type="button" onClick={() => void openExternal(legalUrls.support)}>Suporte</button></nav>
    </section>
  </main>;
}

export function PicoMark() {
  return <div className="pico-mark" aria-hidden="true"><span>Pico</span><i /></div>;
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Compass, Home, MapPin, RefreshCw, UserRound, UsersRound } from 'lucide-react';
import { api, PicoApiError, query } from './api';
import { AuthScreen, GuestScreen, PicoMark } from './auth';
import { parseDeepLink, type DeepLinkTarget, type MobileTab } from './deep-links';
import { mobileConfig } from './config';
import { LocalModeApp } from './local-app';
import { LocalWorkspaceError, type LocalWorkspace, type LocalWorkspaceErrorCode } from './local-model';
import { localRepository } from './local-store';
import {
  bindKeyboardState,
  getLaunchUrl,
  getNetworkStatus,
  onAppStateChange,
  onAppUrlOpen,
  onNetworkChange,
  prepareNativeChrome,
  releasePrivacyCover,
  selectionHaptic,
  setStatusBarContrast,
} from './native';
import { ProfileSetup } from './profile-setup';
import { AccountRightsScreen, ArenasScreen, CommunitiesScreen, HomeScreen, PeopleScreen, ProfileScreen } from './screens';
import { MobileTour } from './tour';
import type { Capabilities, Profile } from './types';
import { Button, ErrorState, Field, LoadingState, Notice, OfflineNotice } from './ui';

type Tab = MobileTab;
type AccountAccessStatus = 'active' | 'suspended' | 'revoked' | 'restricted' | 'deletion_pending';
type AppState =
  | { status: 'booting' }
  | { status: 'signed_out'; notice?: string }
  | { status: 'guest' }
  | { status: 'local'; workspace: LocalWorkspace }
  | { status: 'local_error'; code?: LocalWorkspaceErrorCode; message: string }
  | { status: 'deletion_pending' }
  | { status: 'restricted'; accessStatus: 'suspended' | 'revoked' | 'restricted' }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; message: string }
  | { status: 'upgrade'; message: string };

export function MobileApp() {
  const [state, setState] = useState<AppState>({ status: 'booting' });
  const statusRef = useRef<AppState['status']>(state.status);
  const [tab, setTab] = useState<Tab>('home');
  const [deepLink, setDeepLink] = useState<DeepLinkTarget | null>(null);
  const [online, setOnline] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [accountControls, setAccountControls] = useState(false);
  const [privacyValidation, setPrivacyValidation] = useState(0);
  const connectedAttemptRef = useRef(0);

  useLayoutEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  const loadProfile = useCallback(async (attempt = connectedAttemptRef.current) => {
    try {
      const account = await api.request<{ deletionPending: boolean; accessStatus: AccountAccessStatus }>('/account');
      if (attempt !== connectedAttemptRef.current) return;
      if (account.deletionPending || account.accessStatus === 'deletion_pending') {
        setState({ status: 'deletion_pending' });
        return;
      }
      if (account.accessStatus === 'suspended' || account.accessStatus === 'revoked' || account.accessStatus === 'restricted') {
        setState({ status: 'restricted', accessStatus: account.accessStatus });
        return;
      }
      const result = await api.request<{ kind: 'profile'; profile: Profile }>(query('/social', { resource: 'profile' }));
      if (attempt !== connectedAttemptRef.current) return;
      setAccountControls(false);
      setState({ status: 'ready', profile: result.profile });
    } catch (cause) {
      if (attempt !== connectedAttemptRef.current) return;
      if (cause instanceof PicoApiError && cause.code === 'session_ended') return;
      if (cause instanceof PicoApiError && cause.status === 401) {
        setState({ status: 'signed_out' });
      } else {
        setState({ status: 'error', message: cause instanceof Error ? cause.message : 'Não foi possível abrir seu perfil.' });
      }
    }
  }, []);

  const loadConnected = useCallback(async (existingAttempt?: number) => {
    const attempt = existingAttempt ?? ++connectedAttemptRef.current;
    try {
      const nextCapabilities = await api.publicRequest<Capabilities>('/capabilities');
      if (attempt !== connectedAttemptRef.current) return;
      setCapabilities(nextCapabilities);
      await loadProfile(attempt);
    } catch (cause) {
      if (attempt !== connectedAttemptRef.current) return;
      if (cause instanceof PicoApiError && cause.status === 426) setState({ status: 'upgrade', message: cause.message });
      else setState({ status: 'error', message: cause instanceof Error ? cause.message : 'Não foi possível abrir o Pico agora.' });
    }
  }, [loadProfile]);

  const enterLocal = useCallback(async () => {
    const attempt = ++connectedAttemptRef.current;
    setState({ status: 'booting' });
    try {
      await api.cancelPendingRestore();
      if (attempt !== connectedAttemptRef.current) return;
      const workspace = await localRepository.load();
      if (attempt !== connectedAttemptRef.current) return;
      await localRepository.prefer();
      if (attempt !== connectedAttemptRef.current) return;
      setDeepLink(null);
      setTab('home');
      setState({ status: 'local', workspace });
    } catch (cause) {
      if (attempt !== connectedAttemptRef.current) return;
      setState(localErrorState(cause));
    }
  }, []);

  const enterGuest = useCallback(async () => {
    const attempt = ++connectedAttemptRef.current;
    await api.cancelPendingRestore();
    if (attempt !== connectedAttemptRef.current) return;
    setState({ status: 'guest' });
  }, []);

  const leaveLocalView = useCallback(async (notice?: string) => {
    const attempt = ++connectedAttemptRef.current;
    await api.cancelPendingRestore();
    if (attempt !== connectedAttemptRef.current) return;
    setState({ status: 'signed_out', ...(notice ? { notice } : {}) });
  }, []);

  const bootstrap = useCallback(async () => {
    const attempt = ++connectedAttemptRef.current;
    try {
      if (await localRepository.isPreferred()) {
        await api.cancelPendingRestore();
        if (attempt !== connectedAttemptRef.current) return;
        try {
          const workspace = await localRepository.load();
          if (attempt !== connectedAttemptRef.current) return;
          setDeepLink(null);
          setTab('home');
          setState({ status: 'local', workspace });
        } catch (cause) {
          if (attempt !== connectedAttemptRef.current) return;
          setState(localErrorState(cause));
        }
        return;
      }
      if (attempt !== connectedAttemptRef.current) return;
      setState({ status: 'signed_out' });
      const restored = await api.restore();
      if (attempt !== connectedAttemptRef.current) return;
      if (restored) await loadConnected(attempt);
    } catch (cause) {
      if (attempt !== connectedAttemptRef.current) return;
      if (cause instanceof PicoApiError && cause.status === 426) setState({ status: 'upgrade', message: cause.message });
      else setState({ status: 'error', message: cause instanceof Error ? cause.message : 'Não foi possível abrir o Pico agora.' });
    }
  }, [loadConnected]);

  const openUrl = useCallback((value: string) => {
    const target = parseDeepLink(value, mobileConfig.apiOrigin);
    if (!target) return;
    setDeepLink(target.kind === 'tab' ? null : target);
    setTab(target.tab);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void prepareNativeChrome();
      void bootstrap();
    });
    return () => cancelAnimationFrame(frame);
  }, [bootstrap]);

  useEffect(() => {
    const darkMode = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      const butterAtTop = state.status === 'signed_out' || state.status === 'guest';
      void setStatusBarContrast(butterAtTop || !darkMode.matches);
    };
    sync();
    darkMode.addEventListener('change', sync);
    return () => darkMode.removeEventListener('change', sync);
  }, [state.status]);

  useEffect(() => {
    let disposed = false;
    const handles: { remove: () => Promise<void> }[] = [];
    let releaseKeyboard: (() => void) | undefined;

    function retainHandle(registration: Promise<{ remove: () => Promise<void> }>) {
      void registration.then((handle) => {
        if (disposed) {
          void handle.remove();
          return;
        }
        handles.push(handle);
      });
    }

    void getNetworkStatus().then((status) => { if (!disposed) setOnline(status.connected); });
    retainHandle(onNetworkChange((status) => { if (!disposed) setOnline(status.connected); }));
    retainHandle(onAppStateChange((appState) => {
      if (disposed || !appState.isActive) return;
      if (statusRef.current === 'local' || statusRef.current === 'local_error') {
        setPrivacyValidation((value) => value + 1);
        return;
      }
      if (!api.authenticated) {
        setState({ status: 'signed_out' });
        setPrivacyValidation((value) => value + 1);
        return;
      }
      void loadProfile().finally(() => setPrivacyValidation((value) => value + 1));
    }));
    retainHandle(onAppUrlOpen((event) => { if (!disposed) openUrl(event.url); }));
    void getLaunchUrl().then((value) => { if (value?.url && !disposed) openUrl(value.url); });
    void bindKeyboardState().then((release) => {
      if (disposed) {
        release();
        return;
      }
      releaseKeyboard = release;
    });
    const ended = (event: Event) => {
      if (statusRef.current === 'local' || statusRef.current === 'local_error') return;
      const notice = event instanceof CustomEvent && typeof event.detail?.notice === 'string'
        ? event.detail.notice
        : undefined;
      setState({ status: 'signed_out', ...(notice ? { notice } : {}) });
    };
    window.addEventListener('pico:session-ended', ended);
    return () => {
      disposed = true;
      releaseKeyboard?.();
      handles.forEach((handle) => void handle.remove());
      window.removeEventListener('pico:session-ended', ended);
    };
  }, [loadProfile, openUrl]);

  useEffect(() => {
    if (!privacyValidation) return;
    const frame = requestAnimationFrame(() => void releasePrivacyCover());
    return () => cancelAnimationFrame(frame);
  }, [privacyValidation, state.status]);

  if (state.status === 'booting') return <StartupScreen />;
  if (state.status === 'signed_out') return <AuthScreen
    notice={state.notice}
    onAuthenticationStart={() => { connectedAttemptRef.current += 1; }}
    onAuthenticated={() => void loadConnected()}
    onGuest={enterGuest}
    onLocal={() => void enterLocal()}
  />;
  if (state.status === 'guest') return <GuestScreen onExit={() => setState({ status: 'signed_out' })} />;
  if (state.status === 'local') return <LocalModeApp initialWorkspace={state.workspace} onLeave={() => leaveLocalView()} />;
  if (state.status === 'local_error') return <LocalWorkspaceRecoveryScreen
    code={state.code}
    message={state.message}
    onRetry={() => void enterLocal()}
    onLeave={async () => {
      await localRepository.leave();
      await leaveLocalView('Seus dados locais foram preservados neste iPhone.');
    }}
    onErase={async () => {
      await localRepository.erase();
      await leaveLocalView('Os dados locais deste iPhone foram apagados.');
    }}
  />;
  if (state.status === 'deletion_pending') return <PendingDeletionScreen onFinished={() => setState({ status: 'signed_out' })} />;
  if (state.status === 'restricted') return <AccountRightsScreen accessStatus={state.accessStatus} online={online} onSignedOut={() => setState({ status: 'signed_out' })} />;
  if (state.status === 'upgrade') return <BlockingScreen title="Esta versão precisa ser atualizada." message={state.message} />;
  if (state.status === 'error') return <BlockingScreen title="Não foi possível abrir o Pico." message={state.message} onRetry={() => { setState({ status: 'booting' }); void bootstrap(); }} onGuest={enterGuest} onLocal={() => void enterLocal()} />;

  const needsProfile = !state.profile.avatarPath || !state.profile.sports.length || !state.profile.username;
  if (needsProfile && accountControls) return <AccountRightsScreen accessStatus="active" online={online} onBack={() => setAccountControls(false)} onSignedOut={() => setState({ status: 'signed_out' })} />;
  if (needsProfile) return <ProfileSetup profile={state.profile} onAccount={() => setAccountControls(true)} onDone={() => void loadProfile()} />;
  if (editingProfile) return <ProfileSetup profile={state.profile} onCancel={() => setEditingProfile(false)} onDone={() => { setEditingProfile(false); void loadProfile(); }} />;

  const clearDeepLink = () => setDeepLink(null);
  const screen = tab === 'home' ? <HomeScreen online={online} videoPublishing={capabilities?.features.videoPublishing === true} targetPostId={deepLink?.kind === 'post' ? deepLink.id : undefined} onClearTarget={clearDeepLink} />
    : tab === 'people' ? <PeopleScreen online={online} targetUsername={deepLink?.kind === 'player' ? deepLink.username : undefined} onClearTarget={clearDeepLink} />
      : tab === 'communities' ? <CommunitiesScreen online={online} targetSlug={deepLink?.kind === 'community' ? deepLink.slug : undefined} onClearTarget={clearDeepLink} />
        : tab === 'arenas' ? <ArenasScreen targetSlug={deepLink?.kind === 'arena' ? deepLink.slug : undefined} onClearTarget={clearDeepLink} />
          : <ProfileScreen key={deepLink?.kind === 'profile-section' ? deepLink.section : 'profile'} profile={state.profile} online={online} initialSection={deepLink?.kind === 'profile-section' ? deepLink.section : undefined} onEditProfile={() => setEditingProfile(true)} onSignedOut={() => setState({ status: 'signed_out' })} />;

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <header className="app-header"><PicoMark /><div className="app-header-actions"><span>{online ? 'Conectado' : 'Sem conexão'}</span><MobileTour accountId={state.profile.id} onNavigate={(target) => { if (target.section === 'games') setDeepLink({ tab: 'profile', kind: 'profile-section', section: 'games' }); else setDeepLink(null); setTab(target.tab); }} /></div></header>
    {!online && <OfflineNotice />}
    <main id="main-content" tabIndex={-1}>{screen}</main>
    <nav className="tab-bar" aria-label="Navegação principal">
      <TabButton active={tab === 'home'} label="Início" icon={<Home />} onClick={() => { clearDeepLink(); setTab('home'); }} />
      <TabButton active={tab === 'people'} label="Pessoas" icon={<Compass />} onClick={() => { clearDeepLink(); setTab('people'); }} />
      <TabButton active={tab === 'communities'} label="Comunidades" icon={<UsersRound />} onClick={() => { clearDeepLink(); setTab('communities'); }} />
      <TabButton active={tab === 'arenas'} label="Arenas" icon={<MapPin />} onClick={() => { clearDeepLink(); setTab('arenas'); }} />
      <TabButton active={tab === 'profile'} label="Perfil" icon={<UserRound />} onClick={() => { clearDeepLink(); setTab('profile'); }} />
    </nav>
  </div>;
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactElement; onClick: () => void }) {
  return <button type="button" aria-current={active ? 'page' : undefined} onClick={() => { onClick(); void selectionHaptic(); }}>{icon}<span>{label}</span></button>;
}

function StartupScreen() {
  return <main className="startup-screen" id="main-content"><PicoMark /><LoadingState>Abrindo seu Pico…</LoadingState></main>;
}

function BlockingScreen({ title, message, onRetry, onGuest, onLocal }: { title: string; message: string; onRetry?: () => void; onGuest?: () => void; onLocal?: () => void }) {
  return <main className="blocking-screen" id="main-content"><PicoMark /><ErrorState message={message} /><h1>{title}</h1><div className="form-actions">{onGuest && <Button variant="quiet" onClick={onGuest}>Visitar sem conta</Button>}{onLocal && <Button variant="secondary" onClick={onLocal}>Usar só neste iPhone</Button>}{onRetry && <Button onClick={onRetry}><RefreshCw size={18} aria-hidden="true" />Tentar novamente</Button>}</div></main>;
}

function localErrorState(cause: unknown): Extract<AppState, { status: 'local_error' }> {
  if (cause instanceof LocalWorkspaceError) {
    return { status: 'local_error', code: cause.code, message: cause.message };
  }
  return {
    status: 'local_error',
    message: cause instanceof Error ? cause.message : 'Não foi possível abrir o espaço deste iPhone. Nada foi apagado.',
  };
}

function LocalWorkspaceRecoveryScreen({ code, message, onRetry, onLeave, onErase }: {
  code?: LocalWorkspaceErrorCode;
  message: string;
  onRetry: () => void;
  onLeave: () => Promise<void>;
  onErase: () => Promise<void>;
}) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const confirmationInput = useRef<HTMLInputElement>(null);
  const confirmationTrigger = useRef<HTMLButtonElement>(null);
  const confirmationWasOpen = useRef(false);
  const canErase = code === 'corrupt';
  const title = code === 'future_version'
    ? 'Atualize o Pico para abrir este espaço.'
    : 'Seus dados locais continuam guardados.';

  useLayoutEffect(() => {
    if (confirmationOpen) {
      confirmationWasOpen.current = true;
      confirmationInput.current?.focus({ preventScroll: true });
      return;
    }
    if (confirmationWasOpen.current) {
      confirmationWasOpen.current = false;
      confirmationTrigger.current?.focus({ preventScroll: true });
    }
  }, [confirmationOpen]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setActionError('');
    try {
      await action();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível concluir agora.');
      setBusy(false);
    }
  }

  return <main className="blocking-screen local-recovery" id="main-content">
    <PicoMark />
    <h1>{title}</h1>
    <ErrorState message={actionError || message} />
    <p>{code === 'future_version' || code === 'too_large'
      ? 'O arquivo foi preservado. Você pode tentar de novo depois de atualizar o aplicativo ou voltar à entrada sem remover seus dados.'
      : 'Tente abrir novamente. Se preferir, volte à entrada; isso não apaga o arquivo local.'}</p>
    <div className="form-actions">
      <Button variant="quiet" disabled={busy} onClick={() => void run(onLeave)}>Sair do modo local</Button>
      <Button disabled={busy} onClick={onRetry}><RefreshCw size={18} aria-hidden="true" />Tentar novamente</Button>
    </div>
    {canErase && !confirmationOpen && <button ref={confirmationTrigger} type="button" className="help-link" disabled={busy} onClick={() => setConfirmationOpen(true)}>Apagar o arquivo local corrompido</button>}
    {canErase && confirmationOpen && <form className="local-recovery-erase" onSubmit={(event) => { event.preventDefault(); if (confirmation === 'APAGAR') void run(onErase); }}>
      <Notice tone="warning">Só continue se você não precisa mais tentar recuperar esse arquivo. Esta ação não pode ser desfeita.</Notice>
      <Field label="Digite APAGAR para confirmar"><input ref={confirmationInput} autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value.toLocaleUpperCase('pt-BR'))} autoCapitalize="characters" autoCorrect="off" /></Field>
      <div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={() => { setConfirmationOpen(false); setConfirmation(''); }}>Cancelar</Button><Button type="submit" variant="danger" disabled={busy || confirmation !== 'APAGAR'}>{busy ? 'Apagando…' : 'Apagar arquivo local'}</Button></div>
    </form>}
  </main>;
}

function PendingDeletionScreen({ onFinished }: { onFinished: () => void }) {
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function finishDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== 'EXCLUIR' || busy) return;
    setBusy(true);
    setError('');
    try {
      const password = String(new FormData(event.currentTarget).get('password') || '');
      await api.markDeletionIntent();
      await api.request('/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      });
      await api.wipe(true);
      onFinished();
    } catch (cause) {
      if (cause instanceof PicoApiError && cause.status >= 400 && cause.status < 500) {
        await api.clearDeletionIntent().catch(() => undefined);
      }
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a exclusão agora.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível sair agora.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="blocking-screen pending-deletion" id="main-content">
    <PicoMark />
    <h1>Conclua a exclusão da conta.</h1>
    <p>A conta já está bloqueada para novas ações. Confirme sua senha para retomar a remoção segura dos dados e da mídia.</p>
    <form onSubmit={finishDeletion}>
      <Field label="Senha"><input name="password" required type="password" autoComplete="current-password" /></Field>
      <Field label="Digite EXCLUIR para confirmar"><input value={confirmation} onChange={(event) => setConfirmation(event.target.value.toLocaleUpperCase('pt-BR'))} autoCapitalize="characters" autoCorrect="off" /></Field>
      {error && <ErrorState message={error} />}
      <div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={() => void signOut()}>Sair desta conta</Button><Button type="submit" variant="danger" disabled={busy || confirmation !== 'EXCLUIR'}>{busy ? 'Concluindo…' : 'Concluir exclusão'}</Button></div>
    </form>
  </main>;
}

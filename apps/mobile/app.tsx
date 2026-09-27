import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Compass, Home, MapPin, RefreshCw, UserRound, UsersRound } from 'lucide-react';
import { api, PicoApiError, query } from './api';
import { AuthScreen, GuestScreen, PicoMark } from './auth';
import { parseDeepLink, type DeepLinkTarget, type MobileTab } from './deep-links';
import { mobileConfig } from './config';
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
import { Button, ErrorState, Field, LoadingState, OfflineNotice } from './ui';

type Tab = MobileTab;
type AccountAccessStatus = 'active' | 'suspended' | 'revoked' | 'restricted' | 'deletion_pending';
type AppState =
  | { status: 'booting' }
  | { status: 'signed_out'; notice?: string }
  | { status: 'guest' }
  | { status: 'deletion_pending' }
  | { status: 'restricted'; accessStatus: 'suspended' | 'revoked' | 'restricted' }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; message: string }
  | { status: 'upgrade'; message: string };

export function MobileApp() {
  const [state, setState] = useState<AppState>({ status: 'booting' });
  const [tab, setTab] = useState<Tab>('home');
  const [deepLink, setDeepLink] = useState<DeepLinkTarget | null>(null);
  const [online, setOnline] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [accountControls, setAccountControls] = useState(false);
  const [privacyValidation, setPrivacyValidation] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const account = await api.request<{ deletionPending: boolean; accessStatus: AccountAccessStatus }>('/account');
      if (account.deletionPending || account.accessStatus === 'deletion_pending') {
        setState({ status: 'deletion_pending' });
        return;
      }
      if (account.accessStatus === 'suspended' || account.accessStatus === 'revoked' || account.accessStatus === 'restricted') {
        setState({ status: 'restricted', accessStatus: account.accessStatus });
        return;
      }
      const result = await api.request<{ kind: 'profile'; profile: Profile }>(query('/social', { resource: 'profile' }));
      setAccountControls(false);
      setState({ status: 'ready', profile: result.profile });
    } catch (cause) {
      if (cause instanceof PicoApiError && cause.code === 'session_ended') return;
      if (cause instanceof PicoApiError && cause.status === 401) {
        setState({ status: 'signed_out' });
      } else {
        setState({ status: 'error', message: cause instanceof Error ? cause.message : 'Não foi possível abrir seu perfil.' });
      }
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setCapabilities(await api.publicRequest<Capabilities>('/capabilities'));
      const restored = await api.restore();
      if (!restored) setState({ status: 'signed_out' });
      else await loadProfile();
    } catch (cause) {
      if (cause instanceof PicoApiError && cause.status === 426) setState({ status: 'upgrade', message: cause.message });
      else setState({ status: 'error', message: cause instanceof Error ? cause.message : 'Não foi possível abrir o Pico agora.' });
    }
  }, [loadProfile]);

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
    void getNetworkStatus().then((status) => { if (!disposed) setOnline(status.connected); });
    void onNetworkChange((status) => setOnline(status.connected)).then((handle) => handles.push(handle));
    void onAppStateChange((appState) => {
      if (!appState.isActive) return;
      if (!api.authenticated) {
        setState({ status: 'signed_out' });
        setPrivacyValidation((value) => value + 1);
        return;
      }
      void loadProfile().finally(() => setPrivacyValidation((value) => value + 1));
    }).then((handle) => handles.push(handle));
    void onAppUrlOpen((event) => openUrl(event.url)).then((handle) => handles.push(handle));
    void getLaunchUrl().then((value) => { if (value?.url && !disposed) openUrl(value.url); });
    void bindKeyboardState().then((release) => { releaseKeyboard = release; });
    const ended = (event: Event) => {
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
  if (state.status === 'signed_out') return <AuthScreen notice={state.notice} onAuthenticated={() => void loadProfile()} onGuest={() => setState({ status: 'guest' })} />;
  if (state.status === 'guest') return <GuestScreen onExit={() => setState({ status: 'signed_out' })} />;
  if (state.status === 'deletion_pending') return <PendingDeletionScreen onFinished={() => setState({ status: 'signed_out' })} />;
  if (state.status === 'restricted') return <AccountRightsScreen accessStatus={state.accessStatus} online={online} onSignedOut={() => setState({ status: 'signed_out' })} />;
  if (state.status === 'upgrade') return <BlockingScreen title="Esta versão precisa ser atualizada." message={state.message} />;
  if (state.status === 'error') return <BlockingScreen title="Não foi possível abrir o Pico." message={state.message} onRetry={() => { setState({ status: 'booting' }); void bootstrap(); }} onGuest={() => setState({ status: 'guest' })} />;

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

function BlockingScreen({ title, message, onRetry, onGuest }: { title: string; message: string; onRetry?: () => void; onGuest?: () => void }) {
  return <main className="blocking-screen" id="main-content"><PicoMark /><ErrorState message={message} /><h1>{title}</h1><div className="form-actions">{onGuest && <Button variant="quiet" onClick={onGuest}>Visitar sem conta</Button>}{onRetry && <Button onClick={onRetry}><RefreshCw size={18} aria-hidden="true" />Tentar novamente</Button>}</div></main>;
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

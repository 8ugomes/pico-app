'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { beginPushEnrollment, cancelPushAttempt, pushRegistration, pushRequest, pushSupport, removeDevicePush, rememberPushOwner, vapidBytes, type PushAvailability, type PushStatus } from '@/lib/push/client';

export function PushSettings({ demo }: { demo: boolean }) {
  const [availability, setAvailability] = useState<PushAvailability | null>(null);
  const [support, setSupport] = useState<ReturnType<typeof pushSupport>>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    if (demo || locked.current) return;
    const current = ++generation.current;
    try {
      const available = await pushRequest<PushAvailability>();
      const supported = pushSupport();
      const permitted = 'Notification' in window ? Notification.permission : 'default';
      const registration = await pushRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      const status = subscription ? await pushRequest<PushStatus>({ action: 'status', endpoint: subscription.endpoint }) : null;
      if (current !== generation.current) return;
      setAvailability(available); setSupport(supported); setPermission(permitted);
      setSubscribed(Boolean(status?.subscribed)); setError('');
    } catch {
      if (current === generation.current) { setAvailability(null); setSubscribed(false); setError('Não foi possível conferir as notificações deste aparelho.'); }
    }
  }, [demo]);

  useEffect(() => {
    if (demo) return;
    let live = true;
    queueMicrotask(() => { if (live) void refresh(); });
    let identity: string | null = null;
    const auth = createClient()?.auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (event === 'INITIAL_SESSION') { identity = next; return; }
      if (event === 'SIGNED_OUT' || identity !== next) {
        identity = next; generation.current += 1;
        setAvailability(null); setSubscribed(false); setNotice(''); setError('');
        void refresh();
      }
    }).data.subscription;
    const focus = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', focus);
    return () => { live = false; generation.current += 1; auth?.unsubscribe(); window.removeEventListener('focus', focus); };
  }, [demo, refresh]);

  async function enable() {
    if (locked.current || !availability?.enabled || !availability.publicKey || support !== 'supported') return;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    const current = ++generation.current;
    let created: PushSubscription | null = null;
    const finishEnrollment = beginPushEnrollment(availability.viewerId);
    try {
      // The browser permission prompt is directly inside the person's click.
      const permitted = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (current !== generation.current) return;
      setPermission(permitted);
      if (permitted !== 'granted') { setNotice('Você pode continuar usando o Pico sem notificações no aparelho.'); return; }
      const existing = await navigator.serviceWorker.getRegistration('/');
      if (existing && !await pushRegistration()) throw Error('Atualize o Pico antes de ativar as notificações.');
      const registration = await navigator.serviceWorker.register('/push-sw.js', { scope: '/', updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      const previous = await registration.pushManager.getSubscription();
      if (previous) {
        // An endpoint from a different/expired account is never reassigned.
        await removeDevicePush();
      }
      if (current !== generation.current) return;
      created = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidBytes(availability.publicKey) });
      if (current !== generation.current) { await cancelPushAttempt(created); return; }
      const saved = await pushRequest<{ subscribed: boolean; viewerId: string }>({ action: 'subscribe', subscription: created.toJSON(), expectedViewerId: availability.viewerId });
      if (current === generation.current) { rememberPushOwner(saved.viewerId); setSubscribed(true); setNotice('Notificações ativadas neste aparelho.'); }
      else await cancelPushAttempt(created);
    } catch (failure) {
      if (created) await cancelPushAttempt(created);
      if (current === generation.current) setError(failure instanceof Error && failure.name === 'Error' ? failure.message : 'Não foi possível ativar agora. Confira as permissões e tente novamente.');
    } finally { finishEnrollment(); locked.current = false; setBusy(false); }
  }

  async function disable() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    const current = ++generation.current;
    try {
      await removeDevicePush();
      if (current === generation.current) { setSubscribed(false); setNotice('Notificações desativadas neste aparelho.'); }
    } catch {
      if (current === generation.current) setError('Não foi possível desativar agora. Confira sua conexão e tente novamente.');
    } finally { locked.current = false; setBusy(false); }
  }

  if (demo) return null;
  return <section className="push-settings" aria-labelledby="push-settings-title">
    <div className="push-settings-heading"><Bell size={18} aria-hidden="true" /><h2 id="push-settings-title">No seu aparelho</h2></div>
    <p>{availability?.enabled ? 'Receba' : 'Quando disponíveis, receba'} avisos de mensagens e comunidades mesmo com o Pico fechado. O texto das mensagens e os nomes das pessoas ficam dentro do app.</p>
    {!availability && !error && <p role="status">Conferindo disponibilidade…</p>}
    {availability && !availability.enabled && <p className="form-note">As notificações no aparelho ainda não estão disponíveis nesta versão.</p>}
    {availability?.enabled && support === 'install' && <p>Para receber no iPhone ou iPad, <Link href="/instalar">adicione o Pico à Tela de Início</Link> e abra pelo ícone.</p>}
    {availability?.enabled && support === 'unsupported' && <p>Este navegador não oferece notificações para o Pico. Os avisos continuam nesta página.</p>}
    {availability?.enabled && support === 'supported' && permission === 'denied' && <p>A permissão está bloqueada. Para ativar, permita notificações do Pico nos ajustes do navegador ou do aparelho.</p>}
    {subscribed ? <Button variant="quiet" size="small" onClick={() => void disable()} disabled={busy}><BellOff size={17} aria-hidden="true" />{busy ? 'Aguarde…' : 'Desativar neste aparelho'}</Button>
      : availability?.enabled && support === 'supported' && permission !== 'denied' && <Button size="small" onClick={() => void enable()} disabled={busy}>{busy ? 'Aguarde…' : 'Ativar notificações'}</Button>}
    {notice && <p role="status" className="form-note">{notice}</p>}
    {error && <div role="alert"><p className="form-error">{error}</p>{!busy && <Button variant="quiet" size="small" onClick={() => void refresh()}>Conferir novamente</Button>}</div>}
  </section>;
}

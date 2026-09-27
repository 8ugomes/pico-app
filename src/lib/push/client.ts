export type PushAvailability = { enabled: boolean; publicKey?: string; viewerId: string };
export type PushStatus = { enabled: boolean; subscribed: boolean; expiresAt: string | null };
const ownerKey = 'pico.push-owner.v1';
let reconciliation = 0;
let enrollment: { owner: string; token: symbol } | null = null;

export function beginPushEnrollment(owner: string): () => void {
  const token = Symbol('push-enrollment');
  enrollment = { owner, token };
  reconciliation += 1; // Retire a status request that predates this opt-in.
  return () => { if (enrollment?.token === token) enrollment = null; };
}

export function rememberPushOwner(owner: string | null) {
  try { if (owner) localStorage.setItem(ownerKey, owner); else localStorage.removeItem(ownerKey); } catch { /* The server can still confirm ownership online. */ }
}

function rememberedOwner(): string | null { try { return localStorage.getItem(ownerKey); } catch { return null; } }

export function pushSupport(): 'supported' | 'install' | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (appleMobile && !installed) return 'install';
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window ? 'supported' : 'unsupported';
}

export async function pushRequest<T>(body?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/push', {
    method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.message || 'Não foi possível atualizar as notificações.'); Object.assign(error, { status: response.status }); throw error; }
  return result.data as T;
}

export async function pushRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const worker = registration?.active ?? registration?.waiting ?? registration?.installing;
  return worker && new URL(worker.scriptURL).pathname === '/push-sw.js' ? registration : undefined;
}

export function vapidBytes(key: string): Uint8Array<ArrayBuffer> {
  const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - key.length % 4) % 4));
  return Uint8Array.from(raw, character => character.charCodeAt(0));
}

function revokeEndpoint(endpoint: string): Promise<boolean> {
  return fetch('/api/push', { method: 'POST', cache: 'no-store', credentials: 'same-origin', keepalive: true,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unsubscribe', endpoint }),
    signal: AbortSignal.timeout(1500) }).then(response => response.ok);
}

export async function cancelPushAttempt(subscription: PushSubscription): Promise<void> {
  // Covers a saved subscription whose HTTP response was lost or arrived after
  // identity changed. The server still derives ownership from its current JWT;
  // canceling the original browser object cannot remove a newer endpoint.
  await Promise.allSettled([revokeEndpoint(subscription.endpoint), subscription.unsubscribe()]);
}

export async function removeDevicePush(expectedEndpoint?: string): Promise<void> {
  const registration = await pushRegistration();
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (expectedEndpoint && subscription?.endpoint !== expectedEndpoint) return;
  rememberPushOwner(null);
  void registration.getNotifications().then(notifications => notifications.forEach(notification => notification.close())).catch(() => undefined);
  if (!subscription) return;
  const results = await Promise.allSettled([
    revokeEndpoint(subscription.endpoint),
    subscription.unsubscribe(),
  ]);
  // Either the server binding or the browser endpoint can stop future delivery.
  // A failed remote cleanup is retried by expiry/404/410, never claimed as done.
  if (!results.some(result => result.status === 'fulfilled' && result.value === true)) throw Error('Não foi possível desativar as notificações.');
}

// Called by the global session boundary, including INITIAL_SESSION. This also
// covers a browser reopened after its cookies expired or were replaced elsewhere.
export async function reconcileDevicePush(userId: string | null): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  // Closing the permission dialog can focus the app before subscribe is saved.
  // Do not mistake that expected same-account gap for a foreign subscription.
  if (userId && enrollment?.owner === userId) return;
  const current = ++reconciliation;
  try {
    const registration = await pushRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (current !== reconciliation) return;
    if (!subscription) { rememberPushOwner(null); return; }
    const owner = rememberedOwner();
    let shouldRemove = !userId || Boolean(owner && owner !== userId);
    if (!shouldRemove) {
      try {
        const status = await pushRequest<PushStatus>({ action: 'status', endpoint: subscription.endpoint });
        if (current !== reconciliation) return;
        shouldRemove = !status.subscribed;
        if (!shouldRemove) rememberPushOwner(userId);
      } catch (error) {
        const status = (error as { status?: number }).status;
        // Known same-account temporary failure preserves an existing opt-in.
        // Unknown ownership fails closed, and auth failures always revoke it.
        shouldRemove = !owner || status === 401 || status === 403;
      }
    }
    if (current === reconciliation && shouldRemove) await removeDevicePush(subscription.endpoint);
  } catch { /* Retry when the app next regains focus; never block access. */ }
}

export async function clearPushBeforeSignOut(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  reconciliation += 1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([removeDevicePush(), new Promise<void>(resolve => { timer = setTimeout(resolve, 1800); })]);
  } catch { /* Logout stays available even when the browser or network fails. */ }
  finally { clearTimeout(timer); }
}

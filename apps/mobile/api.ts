import { mobileConfig } from './config';
import {
  clearAccountDeletionIntent,
  clearAccountLocalContent,
  clearSessionClearPending,
  forgetRememberedAccount,
  markAccountDeletionIntent,
  markSessionClearPending,
  readAccountDeletionIntent,
  readRememberedAccount,
  readSessionClearPending,
  rememberAccountForCleanup,
} from './local-state';
import { clearRefreshToken, playPrivateVideo, readRefreshToken, saveRefreshToken } from './native';
import { SessionGeneration } from './session-generation';
import type { SessionPayload } from './types';

type ApiEnvelope<T> = { data: T; apiVersion: string };
type ApiErrorEnvelope = { error?: { code?: string; message?: string; retryable?: boolean } };

export class PicoApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(status: number, body: ApiErrorEnvelope) {
    super(body.error?.message || 'Não foi possível concluir agora. Tente de novo.');
    this.name = 'PicoApiError';
    this.status = status;
    this.code = body.error?.code || 'request_failed';
    this.retryable = body.error?.retryable ?? status >= 500;
  }
}

class PicoApi {
  #accessToken: string | null = null;
  #expiresAt: number | null = null;
  #user: SessionPayload['user'] | null = null;
  #refreshing: { generation: number; promise: Promise<boolean> } | null = null;
  #sessionGeneration = new SessionGeneration();
  #pendingAccepts = new Set<Promise<boolean>>();

  get user() {
    return this.#user;
  }

  get authenticated() {
    return Boolean(this.#accessToken && this.#user);
  }

  async restore() {
    const generation = this.#sessionGeneration.capture();
    try {
      if (await readSessionClearPending()) {
        await clearRefreshToken();
        const accountId = await readRememberedAccount();
        if (accountId) {
          await clearAccountLocalContent(accountId);
          await clearAccountDeletionIntent(accountId);
          await forgetRememberedAccount(accountId);
        }
        await clearSessionClearPending();
        return false;
      }
    } catch {
      return false;
    }
    const refreshToken = await readRefreshToken().catch(() => null);
    if (!this.#sessionGeneration.isCurrent(generation)) return false;
    if (!refreshToken) {
      const deletionAccount = await readAccountDeletionIntent().catch(() => null);
      if (deletionAccount && this.#sessionGeneration.isCurrent(generation)) await this.wipe(true);
      return false;
    }
    return this.#refresh(refreshToken, generation);
  }

  async ensureFresh() {
    if (!this.#accessToken) return this.restore();
    if (!this.#expiresAt || this.#expiresAt * 1000 - Date.now() > 60_000) return true;
    return this.refresh();
  }

  async signIn(email: string, password: string) {
    const generation = this.#sessionGeneration.capture();
    const session = await this.#auth({ action: 'sign_in', email, password });
    if (!await this.#accept(session, generation)) throw sessionEndedError();
    return session.user;
  }

  async signUp(name: string, email: string, password: string) {
    const generation = this.#sessionGeneration.capture();
    const session = await this.#auth({ action: 'sign_up', name, email, password });
    if (!await this.#accept(session, generation)) throw sessionEndedError();
    return session.user;
  }

  async refresh() {
    const generation = this.#sessionGeneration.capture();
    if (this.#refreshing?.generation === generation) return this.#refreshing.promise;
    const stored = await readRefreshToken().catch(() => null);
    if (!this.#sessionGeneration.isCurrent(generation)) return false;
    if (!stored) {
      this.#forgetAccess();
      return false;
    }
    return this.#refresh(stored, generation);
  }

  async #refresh(refreshToken: string, generation = this.#sessionGeneration.capture()) {
    if (!this.#sessionGeneration.isCurrent(generation)) return false;
    if (this.#refreshing?.generation === generation) return this.#refreshing.promise;
    const promise = (async () => {
      try {
        const session = await this.#auth({ action: 'refresh', refreshToken });
        return this.#accept(session, generation);
      } catch (error) {
        if (error instanceof PicoApiError && (error.status === 400 || error.status === 401)) {
          if (!this.#sessionGeneration.isCurrent(generation)) return false;
          const deletionAccount = await readAccountDeletionIntent().catch(() => null);
          await this.wipe(Boolean(deletionAccount));
          return false;
        }
        throw error;
      }
    })();
    this.#refreshing = { generation, promise };
    const release = () => { if (this.#refreshing?.promise === promise) this.#refreshing = null; };
    void promise.then(release, release);
    return promise;
  }

  async signOut() {
    const accessToken = this.#accessToken;
    const accountId = this.#user?.id ?? await readRememberedAccount().catch(() => null);
    const refreshTokenPromise = readRefreshToken();
    const pendingAccepts = this.#invalidateSession();
    let remoteFailure: unknown;
    try {
      await markSessionClearPending();
      await Promise.allSettled(pendingAccepts);
      const refreshToken = await refreshTokenPromise;
      if (accessToken && refreshToken) {
        const response = await this.#fetch('/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sign_out', refreshToken }),
        }, accessToken);
        await readResponse(response);
      } else if (refreshToken) {
        throw new Error('A sessão remota não pôde ser identificada.');
      }
    } catch (error) {
      remoteFailure = error;
    }
    const notice = remoteFailure
      ? 'Você saiu deste aparelho. Não foi possível confirmar a revogação remota; procure o suporte se precisar encerrar outras sessões.'
      : undefined;
    await this.#clearInvalidatedSession(accountId, true, notice);
  }

  async wipe(clearLocalContent = false, notice?: string) {
    const accountId = this.#user?.id ?? await readRememberedAccount().catch(() => null);
    const pendingAccepts = this.#invalidateSession();
    let markerFailure: unknown;
    try {
      await markSessionClearPending();
    } catch (error) {
      markerFailure = error;
    }
    await Promise.allSettled(pendingAccepts);
    await this.#clearInvalidatedSession(
      accountId,
      clearLocalContent,
      markerFailure
        ? 'A sessão foi fechada, mas o estado de limpeza deste aparelho não pôde ser guardado. Feche o app e procure o suporte antes de emprestar o aparelho.'
        : notice,
    );
    if (markerFailure) throw markerFailure;
  }

  async markDeletionIntent() {
    const accountId = this.#user?.id ?? await readRememberedAccount().catch(() => null);
    if (!accountId) throw sessionEndedError();
    await markAccountDeletionIntent(accountId);
  }

  async clearDeletionIntent() {
    const accountId = this.#user?.id ?? await readRememberedAccount().catch(() => null);
    if (accountId) await clearAccountDeletionIntent(accountId);
  }

  async #clearInvalidatedSession(accountId: string | null, clearLocalContent: boolean, notice?: string) {
    let clearFailure: unknown;
    try {
      await clearRefreshToken();
    } catch (error) {
      clearFailure = error;
    }
    if (clearLocalContent && accountId) {
      try {
        await clearAccountLocalContent(accountId);
        await clearAccountDeletionIntent(accountId);
        await forgetRememberedAccount(accountId);
      } catch (error) {
        clearFailure ??= error;
      }
    }
    if (!clearFailure) {
      try {
        await clearSessionClearPending();
      } catch (error) {
        clearFailure = error;
      }
    }
    this.#forgetAccess();
    const localNotice = clearFailure
      ? 'A sessão foi fechada nesta tela, mas a limpeza segura deste aparelho não foi confirmada. Feche o app e procure o suporte antes de emprestar o aparelho.'
      : notice;
    window.dispatchEvent(new CustomEvent('pico:session-ended', { detail: { notice: localNotice } }));
    if (clearFailure) throw clearFailure;
  }

  async request<T>(path: string, init: RequestInit = {}, retry401 = true): Promise<T> {
    const generation = this.#sessionGeneration.capture();
    if (!this.#accessToken) {
      const restored = await this.restore();
      this.#requireGeneration(generation);
      if (!restored) throw new PicoApiError(401, { error: { code: 'authentication_required', message: 'Entre novamente para continuar.' } });
    }
    const response = await this.#fetch(path, init, this.#accessToken);
    this.#requireGeneration(generation);
    if (response.status === 401 && retry401 && await this.refresh()) {
      this.#requireGeneration(generation);
      return this.request<T>(path, init, false);
    }
    const data = await readResponse<T>(response);
    this.#requireGeneration(generation);
    return data;
  }

  async publicRequest<T>(path: string, init: RequestInit = {}) {
    return readResponse<T>(await this.#fetch(path, init, null));
  }

  async uploadMedia(bucket: 'avatars' | 'post-media', source: Blob, signal?: AbortSignal) {
    const payload = await this.request<{ path: string; bucket: string }>(`/media?bucket=${bucket}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: source,
      signal,
    });
    return payload.path;
  }

  async privateMedia(path: string) {
    const generation = this.#sessionGeneration.capture();
    const target = new URL(path, mobileConfig.apiOrigin);
    const bucket = target.searchParams.get('bucket');
    const itemPath = target.searchParams.get('path');
    if (!bucket || !itemPath) throw new Error('Foto indisponível.');
    if (!this.#accessToken && !await this.restore()) throw new Error('Entre novamente para ver esta foto.');
    this.#requireGeneration(generation);
    let response = await this.#fetch(`/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(itemPath)}`, {}, this.#accessToken);
    this.#requireGeneration(generation);
    if (response.status === 401 && await this.refresh()) {
      this.#requireGeneration(generation);
      response = await this.#fetch(`/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(itemPath)}`, {}, this.#accessToken);
    }
    if (!response.ok) throw await apiError(response);
    const blob = await response.blob();
    this.#requireGeneration(generation);
    return blob;
  }

  async playVideo(path: string) {
    const generation = this.#sessionGeneration.capture();
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.mp4$/.test(path)) {
      throw new Error('Vídeo indisponível.');
    }
    if (!this.#accessToken && !await this.restore()) {
      throw new Error('Entre novamente para ver este vídeo.');
    }
    await this.ensureFresh();
    this.#requireGeneration(generation);
    if (!this.#accessToken) throw new Error('Entre novamente para ver este vídeo.');
    await playPrivateVideo({
      apiOrigin: mobileConfig.apiOrigin,
      path,
      accessToken: this.#accessToken,
      clientVersion: mobileConfig.clientVersion,
    });
  }

  async #auth(body: Record<string, unknown>) {
    const response = await this.#fetch('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, body.action === 'sign_out' ? this.#accessToken : null);
    return readResponse<SessionPayload>(response);
  }

  async #accept(session: SessionPayload, generation: number) {
    const pending = (async () => {
      if (!this.#sessionGeneration.isCurrent(generation)) return false;
      await saveRefreshToken(session.refreshToken);
      if (!this.#sessionGeneration.isCurrent(generation)) return false;
      try {
        await rememberAccountForCleanup(session.user.id);
      } catch (error) {
        await clearRefreshToken().catch(() => undefined);
        throw error;
      }
      if (!this.#sessionGeneration.isCurrent(generation)) return false;
      this.#accessToken = session.accessToken;
      this.#expiresAt = session.expiresAt;
      this.#user = session.user;
      return true;
    })();
    this.#pendingAccepts.add(pending);
    try {
      return await pending;
    } finally {
      this.#pendingAccepts.delete(pending);
    }
  }

  #invalidateSession() {
    this.#sessionGeneration.invalidate();
    const pending = [...this.#pendingAccepts];
    this.#forgetAccess();
    return pending;
  }

  #requireGeneration(generation: number) {
    if (!this.#sessionGeneration.isCurrent(generation)) throw sessionEndedError();
  }

  #forgetAccess() {
    this.#accessToken = null;
    this.#expiresAt = null;
    this.#user = null;
  }

  async #fetch(path: string, init: RequestInit, accessToken: string | null) {
    const headers = new Headers(init.headers);
    headers.set('X-Pico-Client-Version', mobileConfig.clientVersion);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    const timeout = new AbortController();
    const forwardAbort = () => timeout.abort();
    if (init.signal?.aborted) timeout.abort();
    else init.signal?.addEventListener('abort', forwardAbort, { once: true });
    const timeoutId = window.setTimeout(() => timeout.abort(), 30_000);
    try {
      return await fetch(`${mobileConfig.apiOrigin}/api/mobile/v1${path}`, {
        ...init,
        cache: 'no-store',
        credentials: 'omit',
        headers,
        signal: timeout.signal,
      });
    } catch {
      const cancelled = Boolean(init.signal?.aborted);
      throw new PicoApiError(0, {
        error: {
          code: cancelled ? 'request_cancelled' : 'network_unavailable',
          message: cancelled
            ? 'Envio cancelado. Nada foi publicado.'
            : 'Não foi possível conectar agora. Confira sua rede e tente de novo.',
          retryable: !cancelled,
        },
      });
    } finally {
      window.clearTimeout(timeoutId);
      init.signal?.removeEventListener('abort', forwardAbort);
    }
  }
}

async function apiError(response: Response) {
  const body = await response.json().catch(() => ({})) as ApiErrorEnvelope;
  return new PicoApiError(response.status, body);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await apiError(response);
  const body = await response.json() as ApiEnvelope<T>;
  return body.data;
}

export const api = new PicoApi();

function sessionEndedError() {
  return new PicoApiError(401, {
    error: { code: 'session_ended', message: 'Sua sessão terminou. Entre novamente.' },
  });
}

export function query(path: string, values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return `${path}?${params.toString()}`;
}

type HealthConfig = { url: string; key: string; purpose: string; projectRef: string };
type HealthSnapshot = {
  status: 'ok' | 'error';
  checkedAt: string;
  checks: { database: boolean; auth: boolean };
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

// The route supplies a registered environment; no request input selects a target.
// Coalescing and a short, process-local snapshot limit repeated upstream work.
// This is not a distributed rate limiter or an HTTP/CDN cache.
export function createHealthHandler(
  getConfig: () => HealthConfig | null,
  fetcher: typeof fetch = fetch,
  { timeoutMs = 6000, cacheMs = 30_000, now = Date.now } = {},
) {
  let snapshot: HealthSnapshot | undefined;
  let expiresAt = 0;
  let pending: Promise<HealthSnapshot> | undefined;

  async function probe(): Promise<HealthSnapshot> {
    const checkedAt = new Date(now()).toISOString();
    const config = getConfig();
    if (!config) return { status: 'error', checkedAt, checks: { database: false, auth: false } };

    async function read(path: string, method: 'GET' | 'POST', valid: (data: Record<string, unknown>) => boolean) {
      try {
        const response = await fetcher(config!.url + path, {
          method,
          headers: { apikey: config!.key, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
          ...(method === 'POST' ? { body: '{}' } : {}),
          signal: AbortSignal.timeout(timeoutMs),
          redirect: 'error',
          credentials: 'omit',
          cache: 'no-store',
        });
        return response.ok && valid(record(await response.json()));
      } catch {
        // Never forward upstream bodies, URLs, credentials or error messages.
        return false;
      }
    }

    const [database, auth] = await Promise.all([
      read('/rest/v1/rpc/environment_identity', 'POST', data => data.purpose === config.purpose && data.projectRef === config.projectRef),
      read('/auth/v1/settings', 'GET', data => record(data.external).email === true),
    ]);
    return { status: database && auth ? 'ok' : 'error', checkedAt, checks: { database, auth } };
  }

  return async function GET() {
    if (!snapshot || now() >= expiresAt) {
      if (!pending) {
        const startedAt = now();
        pending = probe().then(result => {
          snapshot = result;
          expiresAt = startedAt + cacheMs;
          return result;
        }).finally(() => { pending = undefined; });
      }
      await pending;
    }
    return Response.json(snapshot, {
      status: snapshot?.status === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  };
}

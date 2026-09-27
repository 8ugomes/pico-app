import webpush from 'web-push';
import { pushEndpoint, type PushConfig, type PushDelivery } from './policy.ts';

export type PushOutcome = { outcome: 'sent' | 'retry' | 'gone' | 'discarded'; retryAfter: number };

// Kept separate from scheduling so HTTP behavior is exercised without sending
// to a real endpoint. Provider acceptance is not proof of device delivery.
export async function deliverPush(delivery: PushDelivery, config: PushConfig, send: typeof fetch = fetch): Promise<PushOutcome> {
  const endpoint = pushEndpoint(delivery.endpoint);
  const details = webpush.generateRequestDetails({ endpoint, keys: delivery.keys }, JSON.stringify({ version: 1, kind: delivery.kind }), {
    TTL: delivery.ttl, urgency: 'normal',
    vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey },
  });
  try {
    const response = await send(endpoint, {
      method: 'POST', headers: details.headers,
      body: details.body ? new Uint8Array(details.body) : undefined,
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    const seconds = Number(response.headers.get('retry-after'));
    const retryAfter = Number.isFinite(seconds) ? Math.max(0, Math.min(3600, Math.ceil(seconds))) : 0;
    await response.body?.cancel();
    if (response.ok) return { outcome: 'sent', retryAfter: 0 };
    if (response.status === 404 || response.status === 410) return { outcome: 'gone', retryAfter: 0 };
    if (response.status === 429 || response.status >= 500 || response.status === 401 || response.status === 403) return { outcome: 'retry', retryAfter };
    return { outcome: 'discarded', retryAfter: 0 };
  } catch {
    // Deliberately omit exception messages, URLs, keys and response bodies.
    return { outcome: 'retry', retryAfter: 0 };
  }
}

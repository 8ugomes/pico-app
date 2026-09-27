import { ECDH, createECDH, timingSafeEqual } from 'node:crypto';
import { exactKeys, MutationError } from '../supabase/mutations.ts';

export type WebPushSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };
export type PushConfig = { publicKey: string; privateKey: string; subject: string; dispatchSecret: string };
export type PushDelivery = WebPushSubscription & { kind: 'community' | 'message'; ttl: number };

// Exact service hosts and known paths. No wildcards, credentials, explicit
// ports, queries, fragments, encoded path characters, or arbitrary destinations.
const endpointPattern = /^https:\/\/(?:fcm\.googleapis\.com\/fcm\/send\/|updates\.push\.services\.mozilla\.com\/wpush\/v[12]\/|web\.push\.apple\.com\/)[A-Za-z0-9_:=-]+$/;
const invalid = () => new MutationError(400, 'Este navegador não forneceu uma assinatura de notificações válida.');

export function pushEndpoint(value: unknown): string {
  if (typeof value !== 'string' || value.length < 30 || value.length > 2048 || !endpointPattern.test(value)) throw invalid();
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || url.href !== value) throw invalid();
  return value;
}

function publicKey(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{87}$/.test(value)) throw invalid();
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length !== 65 || bytes[0] !== 4 || bytes.toString('base64url') !== value) throw invalid();
  try { ECDH.convertKey(bytes, 'prime256v1'); } catch { throw invalid(); }
  return value;
}

export function parsePushSubscription(value: unknown): WebPushSubscription {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  const input = value as Record<string, unknown>;
  exactKeys(input, ['endpoint', 'expirationTime', 'keys']);
  if (input.expirationTime != null && (typeof input.expirationTime !== 'number' || !Number.isFinite(input.expirationTime) || input.expirationTime <= Date.now())) throw invalid();
  if (!input.keys || typeof input.keys !== 'object' || Array.isArray(input.keys)) throw invalid();
  const keys = input.keys as Record<string, unknown>;
  exactKeys(keys, ['p256dh', 'auth']);
  if (typeof keys.auth !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(keys.auth)
    || Buffer.from(keys.auth, 'base64url').toString('base64url') !== keys.auth) throw invalid();
  return { endpoint: pushEndpoint(input.endpoint), keys: { p256dh: publicKey(keys.p256dh), auth: keys.auth } };
}

export function getPushConfig(env: NodeJS.ProcessEnv = process.env): PushConfig | null {
  if (env.PICO_WEB_PUSH_ENABLED !== 'true') return null;
  try {
    const pub = publicKey(env.PICO_VAPID_PUBLIC_KEY);
    const priv = env.PICO_VAPID_PRIVATE_KEY ?? '';
    const subject = env.PICO_VAPID_SUBJECT ?? '';
    const secret = env.PICO_PUSH_DISPATCH_SECRET ?? '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(priv) || Buffer.from(priv, 'base64url').toString('base64url') !== priv
      || secret.length < 32 || secret.length > 512 || /\s/.test(secret)) return null;
    if (!/^mailto:[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(subject)) return null;
    const pair = createECDH('prime256v1');
    pair.setPrivateKey(Buffer.from(priv, 'base64url'));
    if (pair.getPublicKey().toString('base64url') !== pub) return null;
    return { publicKey: pub, privateKey: priv, subject, dispatchSecret: secret };
  } catch { return null; }
}

export function authorizedPushDispatch(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || secret.length > 512 || !header?.startsWith('Bearer ')) return false;
  const actual = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function parsePushDelivery(value: unknown): PushDelivery {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  const row = value as Record<string, unknown>;
  if (row.kind !== 'community' && row.kind !== 'message') throw invalid();
  if (!Number.isInteger(row.ttl) || Number(row.ttl) < 1 || Number(row.ttl) > 300) throw invalid();
  return { ...parsePushSubscription({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }), kind: row.kind, ttl: Number(row.ttl) };
}

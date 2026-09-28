const rawOrigin = process.env.PICO_PUBLIC_ORIGIN;
const secret = process.env.PICO_PRODUCT_MEASUREMENT_HEARTBEAT_SECRET;
if (!rawOrigin || !secret || secret.length < 32 || secret.length > 512 || /\s/.test(secret)) {
  throw Error('Configuração protegida do heartbeat indisponível.');
}
const origin = new URL(rawOrigin);
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.port
  || origin.pathname !== '/' || origin.search || origin.hash
  || ![origin.origin, `${origin.origin}/`].includes(rawOrigin)) {
  throw Error('Use a origem HTTPS canônica exata.');
}

const response = await fetch(new URL('/api/internal/product-measurement-heartbeat', origin), {
  method: 'POST',
  headers: { authorization: `Bearer ${secret}` },
  redirect: 'error',
  cache: 'no-store',
  signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw Error(`Heartbeat de medição indisponível (${response.status}).`);

console.log(JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() }));

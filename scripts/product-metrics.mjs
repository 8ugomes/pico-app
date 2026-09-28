import { createClient } from '@supabase/supabase-js';
import { assertRemoteIdentity } from './environment-guard.mjs';

function date(value, fallback) {
  const result = value || fallback;
  const parsed = new Date(`${result}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)
    || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw Error('Use datas YYYY-MM-DD.');
  return result;
}
function shift(value, days) {
  const next = new Date(`${value}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
function saoPauloToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts();
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

if (process.env.PICO_PRODUCT_MEASUREMENT_ENABLED !== 'true') throw Error('Medição de produto está desligada no servidor.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret?.startsWith('sb_secret_')) throw Error('Configuração administrativa indisponível.');
const end = date(process.argv[3], shift(saoPauloToday(), -1));
const start = date(process.argv[2], shift(end, -6));
await assertRemoteIdentity(process.env, 'metrics');
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const result = await client.rpc('product_metrics_snapshot', { p_start: start, p_end: end, p_timezone: 'America/Sao_Paulo' });
if (result.error) throw Error(`Consulta agregada indisponível (${result.error.code || 'unknown'}).`);
if (result.data?.status !== 'ready') throw Error(`Relatório não está pronto (${result.data?.reason || result.data?.status || 'unknown'}).`);
console.log(JSON.stringify(result.data, null, 2));

import { createClient } from '@supabase/supabase-js';
import { assertRemoteIdentity } from './environment-guard.mjs';

if (process.env.PICO_PRODUCT_MEASUREMENT_PURGE_ENABLED !== 'true') {
  throw Error('Manutenção de retenção não foi autorizada neste executor.');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret?.startsWith('sb_secret_')) throw Error('Configuração administrativa indisponível.');

await assertRemoteIdentity(process.env, 'migration');
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const result = await client.rpc('purge_product_events');
if (result.error) throw Error(`Purga de retenção indisponível (${result.error.code || 'unknown'}).`);

console.log(JSON.stringify({ status: 'completed', removed: result.data, completedAt: new Date().toISOString() }));

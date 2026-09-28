import { createClient } from '@supabase/supabase-js';
import { assertRemoteIdentity } from './environment-guard.mjs';

await assertRemoteIdentity(process.env, 'bootstrap');
const uid = process.env.PICO_BOOTSTRAP_UID;
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uid ?? '')) {
  throw Error('Set the out-of-band approved responsible UID in protected environment storage first');
}

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const user = await client.auth.admin.getUserById(uid);
if (user.error || user.data.user.id !== uid) throw Error('Approved responsible identity does not exist in this environment');
const result = await client.rpc('bootstrap_operator', { p_uid: uid });
if (result.error) throw Error('Bootstrap refused');
console.log('Out-of-band approved operator bootstrap completed');

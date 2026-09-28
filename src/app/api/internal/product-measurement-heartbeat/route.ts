import { timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { privateHeaders } from '@/lib/supabase/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(header: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32 || secret.length > 512 || !header?.startsWith('Bearer ')) return false;
  const actual = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// No schedule is installed by this release. Calling the deployed endpoint—not
// Supabase directly—binds every lease renewal to the artifact serving users.
export async function POST(request: Request) {
  if (!authorized(request.headers.get('authorization'), process.env.PICO_PRODUCT_MEASUREMENT_HEARTBEAT_SECRET)) {
    return Response.json({ status: 'error' }, { status: 401, headers: privateHeaders });
  }
  const release = process.env.NEXT_PUBLIC_PICO_VERSION;
  if (!release || release === 'unknown') {
    return Response.json({ status: 'error' }, { status: 503, headers: privateHeaders });
  }
  try {
    const result = await createAdminClient().rpc('heartbeat_product_measurement_edge', {
      p_collecting: process.env.PICO_PRODUCT_MEASUREMENT_ENABLED === 'true',
      p_protocol: 1,
      p_release: release,
    }).abortSignal(AbortSignal.timeout(5000));
    if (result.error || result.data !== true) throw result.error ?? new Error('release_mismatch');
    return new Response(null, { status: 204, headers: privateHeaders });
  } catch {
    return Response.json({ status: 'error' }, { status: 503, headers: privateHeaders });
  }
}

import { createAdminClient } from '@/lib/supabase/admin';
import { privateHeaders } from '@/lib/supabase/api';
import { authorizedPushDispatch, getPushConfig, parsePushDelivery } from '@/lib/push/policy';
import { deliverPush } from '@/lib/push/delivery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// No schedule is installed by this release. The operator invokes this bounded
// worker only after validating the private configuration and database gate.
export async function POST(request: Request) {
  if (!authorizedPushDispatch(request.headers.get('authorization'), process.env.PICO_PUSH_DISPATCH_SECRET)) {
    return Response.json({ status: 'error' }, { status: 401, headers: privateHeaders });
  }
  const config = getPushConfig();
  if (!config) return Response.json({ data: { enabled: false, processed: 0 } }, { headers: privateHeaders });
  try {
    const client = createAdminClient();
    const batch = await client.rpc('claim_push_batch', { p_limit: 20 });
    if (batch.error) throw Error('batch_unavailable');
    const jobs = batch.data ?? [];
    let processed = 0;
    let failed = false;
    // Four independent devices at once; each device has a database lease.
    for (let offset = 0; offset < jobs.length; offset += 4) {
      const outcomes = await Promise.allSettled(jobs.slice(offset, offset + 4).map(async job => {
        const current = await client.rpc('read_push_delivery', { p_job: job.job_id, p_lease: job.lease_token });
        if (current.error) throw Error('delivery_unavailable');
        if (!current.data) return;
        let result: { outcome: 'sent' | 'retry' | 'gone' | 'discarded'; retryAfter: number };
        try { result = await deliverPush(parsePushDelivery(current.data), config); }
        catch { result = { outcome: 'discarded', retryAfter: 0 }; }
        const finished = await client.rpc('finish_push_delivery', {
          p_job: job.job_id, p_lease: job.lease_token, p_outcome: result.outcome, p_retry_after: result.retryAfter,
        });
        if (finished.error) throw Error('receipt_unavailable');
      }));
      processed += outcomes.filter(result => result.status === 'fulfilled').length;
      if (outcomes.some(result => result.status === 'rejected')) { failed = true; break; }
    }
    return Response.json({ data: { enabled: true, processed, remaining: jobs.length - processed } }, { status: failed ? 503 : 200, headers: privateHeaders });
  } catch {
    return Response.json({ status: 'error', message: 'Entrega indisponível.' }, { status: 503, headers: privateHeaders });
  }
}

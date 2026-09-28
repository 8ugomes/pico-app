import 'server-only';
import { after } from 'next/server';
import { productMeasurementEnabled } from '@/lib/features';
import { executeMeasurementWrite } from '@/lib/product-measurement-rpc';
import { createAdminClient } from '@/lib/supabase/admin';

export type ProductEvent = {
  actorId: string;
  eventType: 'discovery_opened' | 'return_active' | 'share_prepared' | 'invitation_opened';
  contextType?: 'profile' | 'arena' | 'community' | 'post' | 'invitation';
  contextId?: string;
};

const RPC_TIMEOUT_MS = 4000;

function warnMeasurement(event: 'product_measurement_write_failed' | 'product_measurement_status_failed') {
  console.warn(JSON.stringify({ event, version: process.env.NEXT_PUBLIC_PICO_VERSION || 'unknown' }));
}

async function writeProductEvent(event: ProductEvent) {
  let admin: ReturnType<typeof createAdminClient>;
  try { admin = createAdminClient(); }
  catch {
    warnMeasurement('product_measurement_write_failed');
    return;
  }
  const outcome = await executeMeasurementWrite(
    () => admin.rpc('record_product_event', {
        p_actor: event.actorId,
      p_event_type: event.eventType,
      p_context_type: event.contextType,
      p_context_id: event.contextId,
      p_release: process.env.NEXT_PUBLIC_PICO_VERSION || 'unknown',
    }).abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS)),
    () => admin.rpc('mark_product_measurement_edge_failure').abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS)),
  );
  // Fixed technical fields only. Product actions never fail because optional
  // measurement is unavailable, and no actor/context identifiers are logged.
  if (outcome.operationalFailure) warnMeasurement('product_measurement_write_failed');
  if (outcome.markerFailed) warnMeasurement('product_measurement_status_failed');
}

// Optional measurement runs after the response and never delays or changes the
// product action. The monitored deployment heartbeat reports the disabled env.
export function recordProductEvent(event: ProductEvent) {
  if (!productMeasurementEnabled()) return;
  after(() => writeProductEvent(event));
}

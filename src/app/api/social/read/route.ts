import { createClient } from '@/lib/supabase/server';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { parseReadRequest, readSocial } from '@/lib/supabase/read-service';
import { ReadError, readMessages } from '@/lib/supabase/read-errors';
import type { ReadResponse } from '@/types/read';
import { productMeasurementEnabled } from '@/lib/features';
import { recordProductEvent } from '@/lib/product-measurement';
import { requireUser } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' };
function respond(body: ReadResponse, status = 200) { return Response.json(body, { status, headers }); }
export async function GET(request: Request) {
  try {
    const input = parseReadRequest(new URL(request.url).searchParams);
    const environment = getSupabaseEnvironment();
    if (environment.status === 'demo') return respond({ status: 'demo' });
    if (environment.status === 'invalid') throw new ReadError('configuration');
    const client = await createClient();
    if (!client) throw new ReadError('configuration');
    const data = await readSocial(client, input);
    if (input.resource === 'player' && data.kind === 'player' && !data.own && productMeasurementEnabled()) {
      const user = await requireUser(client);
      recordProductEvent({ actorId: user.id, eventType: 'discovery_opened', contextType: 'profile' });
    }
    return respond({ status: 'success', data });
  } catch (error) {
    const failure = error instanceof ReadError ? error : new ReadError('unavailable');
    return respond({ status: 'error', code: failure.code, message: readMessages[failure.code] }, failure.status);
  }
}

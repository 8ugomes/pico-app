import { createClient } from '@/lib/supabase/server';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { parseReadRequest, readSocial } from '@/lib/supabase/read-service';
import { ReadError, readMessages } from '@/lib/supabase/read-errors';
import type { ReadResponse } from '@/types/read';

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
    return respond({ status: 'success', data: await readSocial(client, input) });
  } catch (error) {
    const failure = error instanceof ReadError ? error : new ReadError('unavailable');
    return respond({ status: 'error', code: failure.code, message: readMessages[failure.code] }, failure.status);
  }
}

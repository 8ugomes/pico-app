import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/queries';
import { apiError, jsonBody, privateHeaders, sameOrigin } from '@/lib/supabase/api';
import { MutationError } from '@/lib/supabase/mutations';
import { directMessagesEnabled } from '@/lib/features';
import { mutateMessages, parseMessageAction, parseMessageQuery, readMessages } from '@/lib/supabase/direct-messages';

export const dynamic = 'force-dynamic';

async function messageClient() {
  if (!directMessagesEnabled()) throw new MutationError(503, 'As mensagens ainda não estão disponíveis.');
  const client = await createClient();
  if (!client) throw new MutationError(503, 'Não foi possível conectar agora.');
  await requireUser(client);
  return client;
}

export async function GET(request: Request) {
  try {
    const query = parseMessageQuery(request.url);
    const client = await messageClient();
    return Response.json({ data: await readMessages(client, query) }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = parseMessageAction(await jsonBody(request));
    const client = await messageClient();
    return Response.json({ data: await mutateMessages(client, input) }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

import {
  MOBILE_API_VERSION,
  MobileRequestError,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { asMobileError } from '@/lib/mobile/errors';
import { createMobileDataClient, requireMobileUser } from '@/lib/mobile/supabase';
import { parseCommunitySearch } from '@/lib/supabase/community-search';
import { communityContent, exactKeys, mutationFailure, textField, uuid } from '@/lib/supabase/mutations';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';

async function context(request: Request) {
  const { accessToken } = validateMobileRequest(request);
  const client = createMobileDataClient(accessToken!);
  await requireMobileUser(client, accessToken!);
  return client;
}

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const client = await context(request);
    const kind = query.get('kind') || 'directory';
    const result = kind === 'page'
      ? await client.rpc('community_page', { p_slug: textField(query.get('slug'), 1, 80) })
      : kind === 'links'
        ? await client.rpc('arena_link_requests', { p_arena: uuid(query.get('arena')) })
        : kind === 'invites'
          ? await client.rpc('community_invitations', { p_id: uuid(query.get('id')) })
          : kind === 'mentions'
            ? await client.rpc('community_mention_candidates', {
                p_community: uuid(query.get('id')),
                p_search: textField(query.get('search') || '', 0, 80),
              })
            : await client.rpc('community_directory', parseCommunitySearch(query));
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: result.data, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

export async function POST(request: Request) {
  try {
    const body = await readMobileJson(request);
    exactKeys(body, ['action', 'id', 'version', 'data', 'memberAction', 'target', 'role', 'arena', 'linkAction', 'official', 'email', 'token', 'inviteId']);
    const client = await context(request);
    let result;
    switch (body.action) {
      case 'create':
        result = await client.rpc('create_community', { p_data: communityContent(body.data) as Json });
        break;
      case 'edit':
        if (!Number.isInteger(body.version)) throw new MobileRequestError(400, 'invalid_input', 'Atualize a comunidade e tente de novo.');
        result = await client.rpc('save_community', { p_id: uuid(body.id), p_version: body.version as number, p_data: communityContent(body.data) as Json });
        break;
      case 'membership':
        result = await client.rpc('community_membership', {
          p_id: uuid(body.id),
          p_action: textField(body.memberAction, 1, 30),
          p_target: body.target ? uuid(body.target) : undefined,
          p_role: body.role ? textField(body.role, 1, 20) : undefined,
        });
        break;
      case 'link':
        result = await client.rpc('community_link', {
          p_community: uuid(body.id),
          p_arena: uuid(body.arena),
          p_action: textField(body.linkAction, 1, 20),
          p_official: body.official === true,
        });
        break;
      case 'official':
        result = await client.rpc('create_official_community', { p_arena: uuid(body.arena) });
        break;
      case 'invite':
        result = await client.rpc('invite_community_member', { p_id: uuid(body.id), p_email: textField(body.email, 3, 254) });
        break;
      case 'accept':
        result = await client.rpc('accept_community_invite', { p_token: textField(body.token, 64, 64) });
        break;
      case 'revoke':
        result = await client.rpc('community_invitations', { p_id: uuid(body.id), p_revoke: uuid(body.inviteId) });
        break;
      default:
        throw new MobileRequestError(400, 'invalid_action', 'A ação enviada não é válida.');
    }
    if (result.error) mutationFailure(result.error);
    return mobileJson(request, { data: result.data, apiVersion: MOBILE_API_VERSION });
  } catch (error) {
    return mobileError(request, asMobileError(error));
  }
}

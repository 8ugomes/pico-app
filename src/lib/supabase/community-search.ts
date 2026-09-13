import { MutationError, uuid } from './mutations.ts';

export function parseCommunitySearch(params: URLSearchParams) {
  const search = (params.get('search') ?? '').trim();
  const offset = params.get('offset') ?? '0';
  if (search.length > 100 || !/^\d{1,5}$/.test(offset) || Number(offset) > 10000) {
    throw new MutationError(400, 'Revise a busca de comunidades.');
  }
  return { p_search: search, p_mine: params.get('mine') === 'true', p_offset: Number(offset), p_arena: params.get('arena') ? uuid(params.get('arena')) : undefined };
}

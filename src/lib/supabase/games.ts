import { exactKeys, invalid, uuid } from './mutations.ts';
import { validGameDate } from '../game-date.ts';
export function parseGameMutation(body: Record<string, unknown>) {
  if (body.action === 'delete') {
    exactKeys(body, ['action', 'id']);
    return { action: 'delete' as const, id: uuid(body.id) };
  }
  if (body.action !== 'save') return invalid();
  exactKeys(body, ['action', 'id', 'arenaId', 'sportId', 'playedOn', 'version']);
  if (typeof body.playedOn !== 'string' || !validGameDate(body.playedOn)) return invalid();
  if (body.version !== undefined && (!Number.isSafeInteger(body.version) || Number(body.version) < 1)) return invalid();
  return { action: 'save' as const, id: uuid(body.id), arenaId: uuid(body.arenaId), sportId: uuid(body.sportId), playedOn: body.playedOn, version: body.version as number | undefined };
}
export function gameOffset(params: URLSearchParams) {
  if ([...params.keys()].some(key => key !== 'offset')) return invalid();
  const value = params.get('offset') ?? '0';
  if (!/^\d{1,5}$/.test(value) || Number(value) > 10000) return invalid();
  return Number(value);
}

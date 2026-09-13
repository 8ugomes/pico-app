import { exactKeys, invalid, textField, uuid } from './mutations.ts';
export function parseGameShare(body: Record<string, unknown>) {
  exactKeys(body, ['id', 'version', 'key', 'body', 'imagePath', 'audience', 'wallArena', 'groups']);
  if (!Number.isSafeInteger(body.version) || Number(body.version) < 1) return invalid();
  if (!['beta', 'private'].includes(String(body.audience)) || !Array.isArray(body.groups) || body.groups.length > 5) return invalid();
  if (body.imagePath !== null && body.imagePath !== undefined && typeof body.imagePath !== 'string') return invalid();
  return { id: uuid(body.id), version: Number(body.version), key: uuid(body.key), body: textField(body.body, 0, 500),
    imagePath: body.imagePath as string | null | undefined, audience: body.audience as 'beta' | 'private',
    wallArena: body.wallArena ? uuid(body.wallArena) : undefined, groups: body.groups.map(uuid) };
}

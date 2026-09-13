// Decoration only: a stable accent for the same person, never a role or status.
export function personTone(identity: string) {
  let hash = 0;
  for (const char of identity) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ['sand', 'lavender', 'clay'][hash % 3];
}

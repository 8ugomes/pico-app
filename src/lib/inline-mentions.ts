export type MentionQuery = { start: number; end: number; query: string };

const handleCharacter = '[\\p{L}\\p{N}_.-]';
const tokenPattern = new RegExp(`(?:^|[^${handleCharacter.slice(1, -1)}])@(${handleCharacter}+)(?=$|[^${handleCharacter.slice(1, -1)}])`, 'gu');

export function findMentionQuery(body: string, cursor: number): MentionQuery | null {
  const before = body.slice(0, cursor);
  const match = /(?:^|[\s([{])@([\p{L}\p{N}_.-]{0,80})$/u.exec(before);
  if (!match) return null;
  return { start: cursor - match[1].length - 1, end: cursor, query: match[1] };
}

export function insertMention(body: string, query: MentionQuery, username: string): { body: string; cursor: number } {
  const tail = body.slice(query.end);
  const remainder = tail.replace(/^[\p{L}\p{N}_.-]*/u, '');
  const prefix = body.slice(0, query.start) + '@' + username;
  const gap = remainder && !/^\s/u.test(remainder) ? ' ' : remainder ? '' : ' ';
  return { body: prefix + gap + remainder, cursor: prefix.length + gap.length + (gap === '' && /^\s/u.test(remainder) ? 1 : 0) };
}

export function selectedMentionsInText<T extends { id: string; username: string }>(body: string, selected: T[], everyoneSelected: boolean): { people: T[]; everyone: boolean } {
  const handles = new Set([...body.matchAll(tokenPattern)].map(match => match[1].toLocaleLowerCase('pt-BR')));
  const everyone = everyoneSelected && handles.has('todos');
  return { people: everyone ? [] : selected.filter(person => handles.has(person.username.toLocaleLowerCase('pt-BR'))), everyone };
}

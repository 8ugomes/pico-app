export type ContentModerationCode = 'sexual_safety' | 'threat' | 'spam';

export class ContentModerationError extends Error {
  readonly code: ContentModerationCode;

  constructor(code: ContentModerationCode) {
    super('Este texto não pode ser publicado. Revise o conteúdo e tente de novo.');
    this.name = 'ContentModerationError';
    this.code = code;
  }
}

function normalized(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ensurePublishableText(value: string) {
  const text = normalized(value);
  const links = text.match(/https?:\/\/|www\./g)?.length ?? 0;
  if (links >= 3) throw new ContentModerationError('spam');

  const minor = '(?:menor(?:es)?|crianc(?:a|as)|adolescente(?:s)?)';
  const sexual = '(?:nude(?:s)?|sexo|sexual|pornografia|pornografico)';
  if (new RegExp(`(?:${sexual}.{0,48}${minor}|${minor}.{0,48}${sexual})`).test(text)) {
    throw new ContentModerationError('sexual_safety');
  }

  if (/\b(?:eu\s+)?vou\s+(?:te\s+|lhe\s+)?(?:matar|estuprar|agredir)\b/.test(text)
    || /\b(?:matar|estuprar)\s+(?:voce|ele|ela|voces)\b/.test(text)) {
    throw new ContentModerationError('threat');
  }
  return value;
}

export function ensurePublishableCommunity(value: unknown) {
  return ensurePublishableFields(value, ['name', 'description', 'rules']);
}

export function ensurePublishableFields(value: unknown, keys: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const fields = value as Record<string, unknown>;
  for (const key of keys) {
    if (typeof fields[key] === 'string') ensurePublishableText(fields[key]);
  }
  return value;
}

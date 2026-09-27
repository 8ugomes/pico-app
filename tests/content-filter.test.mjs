import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ContentModerationError, ensurePublishableText } from '../src/lib/moderation/text-filter.ts';
import { MutationError, parseMutation } from '../src/lib/supabase/mutations.ts';

test('the deterministic filter keeps ordinary beach-sports conversation', () => {
  assert.equal(ensurePublishableText('Treino de futevôlei amanhã às 8h?'), 'Treino de futevôlei amanhã às 8h?');
});

test('the deterministic filter blocks direct threats and sexual content involving minors', () => {
  for (const content of ['Eu vou te matar depois do jogo', 'manda nude de menor']) {
    assert.throws(
      () => ensurePublishableText(content),
      (error) => error instanceof ContentModerationError,
    );
  }
});

test('the deterministic filter blocks repeated-link spam without logging the content', () => {
  assert.throws(
    () => ensurePublishableText('https://a.example https://b.example https://c.example'),
    (error) => error instanceof ContentModerationError && error.code === 'spam',
  );
});

test('profile location fields use the same publication-safety boundary', () => {
  const profile = {
    action: 'save_profile',
    name: 'Jogadora',
    username: 'jogadora',
    bio: '',
    city: 'Eu vou te matar',
    neighborhood: 'Centro',
    sportId: '10000000-0000-4000-8000-000000000001',
    level: 'Iniciante',
    available: false,
  };
  assert.throws(
    () => parseMutation(profile),
    (error) => error instanceof MutationError && error.status === 400,
  );
});

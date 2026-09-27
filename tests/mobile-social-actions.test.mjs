import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../apps/mobile/social-actions.tsx', import.meta.url), 'utf8');

test('comentários móveis leem sob demanda e só enviam por ação explícita', () => {
  assert.match(source, /query\('\/social', \{ resource: 'comments', postId, offset \}\)/);
  assert.match(source, /onSubmit=\{submitComment\}/);
  assert.match(source, /action: 'create_comment'/);
  assert.match(source, /attempts\.comment\(accountId, postId, nextBody\)/);
  assert.match(source, /key: attempt\.key/);
  assert.match(source, /attempts\.confirmComment/);
  assert.match(source, /O texto só é enviado ao tocar em Enviar/);
  assert.doesNotMatch(source, /setInterval|navigator\.onLine/);
});

test('comentários móveis permitem denúncia privada sem remoção automática', () => {
  assert.match(source, /target: 'comment'/);
  assert.match(source, /O comentário não é removido automaticamente/);
  assert.match(source, /Denúncia registrada\. Só você e a equipe podem vê-la/);
});

test('comentário próprio pode ser excluído no cliente móvel', () => {
  assert.match(source, /action: 'delete_comment'/);
  assert.match(source, /Excluir comentário/);
});

test('republicação móvel respeita permissão, anuncia sucesso e reverte a UI em erro', () => {
  assert.match(source, /if \(!canRepost && !current\) return null/);
  assert.match(source, /action: 'repost'/);
  assert.match(source, /setRepostState\(\{ postId, source: reposted, value: previous \}\)/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /A publicação voltou ao estado anterior nesta tela/);
});

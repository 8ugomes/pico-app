import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { configuredPublicOrigin, parseShareTarget, privilegedInvitationLink, scopeInvitationLink, shareUrl } from '../src/lib/sharing/targets.ts';

test('share targets accept only canonical identifiers and exact keys', () => {
  assert.deepEqual(parseShareTarget({ kind: 'profile', username: 'jogadora_1' }), { kind: 'profile', username: 'jogadora_1' });
  assert.deepEqual(parseShareTarget({ kind: 'arena', slug: 'pico-da-vila' }), { kind: 'arena', slug: 'pico-da-vila' });
  assert.deepEqual(parseShareTarget({ kind: 'community', slug: 'turma-da-areia' }), { kind: 'community', slug: 'turma-da-areia' });
  assert.deepEqual(parseShareTarget({ kind: 'post', id: '00000000-0000-4000-8000-000000000001' }), { kind: 'post', id: '00000000-0000-4000-8000-000000000001' });
  for (const value of [
    { kind: 'profile', username: '../admin' },
    { kind: 'arena', slug: 'Pico?token=1' },
    { kind: 'community', slug: 'turma', token: 'secret' },
    { kind: 'post', id: 'not-a-uuid' },
    { kind: 'message', id: '00000000-0000-4000-8000-000000000001' },
  ]) assert.throws(() => parseShareTarget(value));
});

test('public share URLs require one explicit origin and never preserve attacker URL parts', () => {
  assert.equal(configuredPublicOrigin('https://pico.example'), 'https://pico.example');
  assert.equal(configuredPublicOrigin('http://localhost:3000'), 'http://localhost:3000');
  for (const origin of ['', 'http://pico.example', 'https://user:pass@pico.example', 'https://pico.example/base', 'https://pico.example?token=1', '//pico.example']) {
    assert.throws(() => configuredPublicOrigin(origin));
  }
  assert.equal(shareUrl('https://pico.example', { kind: 'post', path: '/publicacoes/abc', title: 'Post' }), 'https://pico.example/publicacoes/abc');
  const invitation = scopeInvitationLink('https://pico.example', 'arena', { id: '00000000-0000-4000-8000-000000000001', token: 'a'.repeat(64), username: 'jogadora_1' });
  assert.deepEqual(invitation, { id: '00000000-0000-4000-8000-000000000001', username: 'jogadora_1', url: `https://pico.example/convite/arena#${'a'.repeat(64)}` });
  assert.equal('token' in invitation, false);
  assert.equal(privilegedInvitationLink('https://pico.example', '/acesso', { id: 'invite', token: 'b'.repeat(64) }).url, `https://pico.example/acesso#${'b'.repeat(64)}`);
  assert.throws(() => scopeInvitationLink('https://pico.example', 'community', { id: 'id', token: '../segredo' }));
});

test('share endpoint revalidates private boundaries and has no attribution token', async () => {
  const source = await readFile(new URL('../src/lib/sharing/targets.ts', import.meta.url), 'utf8');
  const route = await readFile(new URL('../src/app/api/shares/route.ts', import.meta.url), 'utf8');
  assert.match(route, /sameOrigin\(request\)/);
  assert.match(route, /requireUser\(client\)/);
  assert.doesNotMatch(route, /measurement:/);
  assert.doesNotMatch(route, /location\.origin|token|cookie/i);
  assert.match(source, /eq\('id', userId\)\.eq\('username', target\.username\)/);
  assert.match(source, /result\.data\.visibility !== 'beta'/);
  assert.match(source, /\['open', 'approval'\]/);
  assert.match(source, /result\.data\.audience !== 'beta'/);
  assert.match(source, /result\.data\.moderated_at/);
  assert.match(source, /author\.data\.is_demo/);
  assert.match(source, /post_destinations/);
  assert.match(source, /arenas\.data\?\.some\(arena => arena\.is_demo/);
  assert.ok(route.indexOf('const url = shareUrl(configuredPublicOrigin(), descriptor)') < route.indexOf('recordProductEvent({'));
});

test('sharing UI generates QR locally and does not claim a send', async () => {
  const source = await readFile(new URL('../src/components/pico/ShareActions.tsx', import.meta.url), 'utf8');
  assert.match(source, /import\('qrcode'\)/);
  assert.match(source, /margin: 4/);
  assert.match(source, /qrRequestId/);
  assert.match(source, /QR gerado neste aparelho, sem serviço externo/);
  assert.match(source, /O Pico não presume que houve envio/);
  assert.match(source, /não acompanha ninguém, não entra em comunidade e não aceita convite/);
});

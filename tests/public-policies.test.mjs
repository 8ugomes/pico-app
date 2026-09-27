import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readRoute = (name) => readFile(new URL(`../src/app/${name}/page.tsx`, import.meta.url), 'utf8');

test('public policy routes expose the current account and safety contracts in pt-BR', async () => {
  const [privacy, terms, guidelines, support, layout] = await Promise.all([
    readRoute('privacidade'),
    readRoute('termos'),
    readRoute('diretrizes'),
    readRoute('suporte'),
    readFile(new URL('../src/components/pico/PublicPolicyPage.tsx', import.meta.url), 'utf8'),
  ]);

  for (const source of [privacy, terms, guidelines, support]) {
    assert.match(source, /PublicPolicyPage/);
    assert.match(source, /Pico/);
  }
  assert.match(layout, /id="main-content"/);

  assert.doesNotMatch(privacy, /cadastro aberto e confirmação de e-mail/);
  assert.doesNotMatch(privacy, /com e-mail confirmado/);
  assert.match(privacy, /sem confirmação de e-mail/);
  assert.match(privacy, /endereço informado não comprova titularidade/);

  assert.match(terms, /excluir sua conta/);
  assert.match(terms, /recuperação por e-mail não está disponível/);
  assert.match(guidelines, /Denunciar/);
  assert.match(guidelines, /bloquear/);
  assert.match(support, /canal público de suporte ainda não foi configurado/);
  assert.match(support, /NEXT_PUBLIC_PRIVACY_CONTACT/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { MobileRequestError } from '../src/lib/mobile/api-contract.ts';
import { parseMobileSignUp } from '../src/lib/mobile/signup.ts';
import { MOBILE_TERMS_VERSION } from '../src/lib/mobile/terms.ts';
import { parseMutation } from '../src/lib/supabase/mutations.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const ID = '30000000-0000-4000-8000-000000000002';
const valid = { action: 'sign_up', name: 'Ana', email: 'Ana@Example.com ', password: 'uma-senha-longa-123', termsAccepted: true, termsVersion: MOBILE_TERMS_VERSION };

test('cadastro móvel só cria conta com aceite explícito da versão vigente dos Termos', () => {
  const now = new Date('2026-11-05T12:00:00Z');
  const parsed = parseMobileSignUp(valid, now);
  assert.equal(parsed.email, 'ana@example.com');
  assert.deepEqual(parsed.metadata, { display_name: 'Ana', terms_version: MOBILE_TERMS_VERSION, terms_accepted_at: '2026-11-05T12:00:00.000Z' });
  const termsError = (error) => error instanceof MobileRequestError && error.status === 400 && error.code === 'terms_required';
  for (const bad of [
    { ...valid, termsAccepted: false },
    { ...valid, termsAccepted: 'true' },
    { ...valid, termsVersion: '2020-01-01' },
    { ...valid, termsAccepted: undefined },
    { ...valid, termsVersion: undefined },
  ]) assert.throws(() => parseMobileSignUp(bad), termsError);
  assert.throws(() => parseMobileSignUp({ ...valid, role: 'admin' }), (e) => e.status === 400 && e.code === 'invalid_input');
  assert.throws(() => parseMobileSignUp({ ...valid, password: 'curta' }), (e) => e.status === 400);
});

test('rota de cadastro usa o validador e o cliente envia o aceite, sem pular a caixa', async () => {
  const [route, api, auth] = await Promise.all([read('src/app/api/mobile/v1/auth/route.ts'), read('apps/mobile/api.ts'), read('apps/mobile/auth.tsx')]);
  assert.match(route, /parseMobileSignUp\(body\)/);
  assert.match(route, /options: \{ data: signUp\.metadata \}/);
  assert.match(api, /termsAccepted: true, termsVersion: MOBILE_TERMS_VERSION/);
  assert.match(api, /if \(!termsAccepted\) throw/);
  assert.match(auth, /<input type="checkbox" name="terms" value="accepted" required \/>/);
  assert.doesNotMatch(auth, /type="checkbox"[^>]*(defaultChecked|checked)/);
  assert.match(auth, /values\.get\('terms'\) === 'accepted'/);
});

test('privacidade, termos, diretrizes e suporte ficam acessíveis em cadastro, visita, modo local e conta', async () => {
  const [auth, local, screens] = await Promise.all([read('apps/mobile/auth.tsx'), read('apps/mobile/local-app.tsx'), read('apps/mobile/screens.tsx')]);
  const links = auth.match(/export function LegalLinks\(\)[\s\S]*?\n}/)?.[0] ?? '';
  for (const key of ['privacy', 'terms', 'guidelines', 'support']) assert.match(links, new RegExp(`legalUrls\\.${key}`));
  assert.equal((auth.match(/<LegalLinks \/>/g) ?? []).length, 2, 'tela de acesso e visita');
  assert.match(local, /<LegalLinks \/>/);
  for (const key of ['privacy', 'terms', 'guidelines', 'support']) assert.match(screens, new RegExp(`legalUrls\\.${key}`));
  const config = await read('apps/mobile/config.ts');
  for (const path of ['privacidade', 'termos', 'diretrizes', 'suporte']) {
    assert.match(config, new RegExp(`/${path}\``));
    await read(`src/app/${path}/page.tsx`);
  }
});

test('denúncia e bloqueio do cliente produzem exatamente o contrato aceito pelo servidor', async () => {
  const screens = await read('apps/mobile/screens.tsx');
  const social = await read('apps/mobile/social-actions.tsx');
  assert.match(screens, /action: 'report', target, id, reason, details/);
  assert.match(screens, /action: 'set_block', playerId: player\.id, blocked: true/);
  assert.match(social, /action: 'report', target: 'comment'/);
  assert.match(screens, /action: 'set_block'[\s\S]*Desbloquear|BlockedPlayers/);
  for (const target of ['player', 'post', 'comment']) {
    assert.deepEqual(parseMutation({ action: 'report', target, id: ID, reason: 'harassment', details: '' }), { action: 'report', target, id: ID, reason: 'harassment', details: '' });
  }
  assert.deepEqual(parseMutation({ action: 'set_block', playerId: ID, blocked: true }), { action: 'set_block', playerId: ID, blocked: true });
  assert.deepEqual(parseMutation({ action: 'set_block', playerId: ID, blocked: false }), { action: 'set_block', playerId: ID, blocked: false });
  assert.throws(() => parseMutation({ action: 'report', target: 'post', id: ID, reason: 'inventado', details: '' }), (e) => e.status === 400);
  assert.throws(() => parseMutation({ action: 'report', target: 'post', id: ID, reason: 'spam', details: '', reporterId: ID }), (e) => e.status === 400);
});

test('exclusão de conta é um caminho dentro do app, sem e-mail ou chat, e a rota apaga dados e identidade', async () => {
  const [screens, app, route] = await Promise.all([read('apps/mobile/screens.tsx'), read('apps/mobile/app.tsx'), read('src/app/api/mobile/v1/account/route.ts')]);
  assert.match(screens, /Excluir minha conta/);
  assert.match(screens, /\/account', \{ method: 'DELETE'[\s\S]*password, confirmation/);
  assert.doesNotMatch(screens.match(/function DeleteDialog[\s\S]*?\n}\n/)?.[0] ?? '', /mailto:|openExternal/);
  assert.match(route, /body\.confirmation !== 'EXCLUIR'/);
  assert.match(route, /reauthenticate\(user, body\.password\)/);
  assert.match(route, /erase_account_private_data/);
  assert.match(route, /auth\.admin\.deleteUser/);
  for (const bucket of ['avatars', 'post-media', 'post-videos']) assert.match(route, new RegExp(bucket));
  assert.match(screens, /Conta e privacidade|Acesso e privacidade/);
  assert.match(app, /method: 'DELETE'/);
});

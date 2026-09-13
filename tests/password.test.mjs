import test from 'node:test';
import assert from 'node:assert/strict';
import { newPasswordError, passwordConfirmationError } from '../src/lib/auth/password.ts';
test('new password policy counts characters and rejects bcrypt byte overflow',()=>{
 assert.match(newPasswordError('12345678901'),/12/);
 assert.equal(newPasswordError('uma frase longa e única'),null);
 assert.equal(newPasswordError('a'.repeat(72)),null);
 assert.match(newPasswordError('a'.repeat(73)),/72/);
 assert.match(newPasswordError('🙂'.repeat(19)),/72/);
 assert.match(newPasswordError('🙂'.repeat(11)),/12/);
 assert.equal(newPasswordError('🙂'.repeat(12)),null);
});

test('password confirmation compares exactly without trimming, folding case or Unicode normalization', () => {
 assert.equal(passwordConfirmationError('minha senha única', 'minha senha única'), null);
 for (const [password, confirmation] of [['senha correta', 'senha corretb'], ['senha correta', ''], ['senha correta ', 'senha correta'], ['Senha correta', 'senha correta'], ['senha com é', 'senha com e\u0301']]) {
  assert.match(passwordConfirmationError(password, confirmation), /não coincidem/);
 }
});

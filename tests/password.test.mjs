import test from 'node:test';
import assert from 'node:assert/strict';
import { newPasswordError } from '../src/lib/auth/password.ts';
test('new password policy counts characters and rejects bcrypt byte overflow',()=>{
 assert.match(newPasswordError('12345678901'),/12/);
 assert.equal(newPasswordError('uma frase longa e única'),null);
 assert.equal(newPasswordError('a'.repeat(72)),null);
 assert.match(newPasswordError('a'.repeat(73)),/72/);
 assert.match(newPasswordError('🙂'.repeat(19)),/72/);
 assert.match(newPasswordError('🙂'.repeat(11)),/12/);
 assert.equal(newPasswordError('🙂'.repeat(12)),null);
});

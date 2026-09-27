import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../apps/mobile/tour.tsx', import.meta.url), 'utf8');

test('guia móvel é opcional, curto, retomável e isolado por conta', () => {
  assert.match(source, /pico\.mobile\.tour\.v1\.\$\{accountId\}/);
  assert.equal((source.match(/title: '/g) || []).length, 3);
  assert.match(source, /status: 'paused'/);
  assert.match(source, /Explorar sozinho/);
  assert.match(source, /Continuar depois/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|accessToken|refreshToken|password/);
});

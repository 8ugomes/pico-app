import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync('src/lib/supabase/post-video.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
runInNewContext(compiled, {
  exports,
  require: () => ({ MutationError: class MutationError extends Error { constructor(status, message) { super(message); this.status = status; } } }),
});

test('video ranges support seeking, suffix requests and bounded private chunks', () => {
  assert.deepEqual({ ...exports.videoRange(null, 200) }, { start: 0, end: 199 });
  assert.deepEqual({ ...exports.videoRange('bytes=150-', 200) }, { start: 150, end: 199 });
  assert.deepEqual({ ...exports.videoRange('bytes=-50', 200) }, { start: 150, end: 199 });
  assert.deepEqual({ ...exports.videoRange('bytes=-500', 200) }, { start: 0, end: 199 });
  assert.deepEqual({ ...exports.videoRange('bytes=-2097152', 3 * 1024 * 1024) }, { start: 2 * 1024 * 1024, end: 3 * 1024 * 1024 - 1 });
  for (const invalid of ['bytes=-0', 'bytes=-', 'bytes=200-', 'bytes=25-10', 'bytes=0-1,5-6'])
    assert.throws(() => exports.videoRange(invalid, 200), error => error.status === 416);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectHeif } from '../src/lib/photos/image.ts';

const box = (kind, data) => { const header=Buffer.alloc(8);header.writeUInt32BE(data.length+8);header.write(kind,4);return Buffer.concat([header,data]); };
function envelope(width=640,height=480) {
  const size=Buffer.alloc(12);size.writeUInt32BE(width,4);size.writeUInt32BE(height,8);
  return Buffer.concat([box('ftyp',Buffer.from('heic\0\0\0\0mif1heic','binary')),box('meta',Buffer.concat([Buffer.alloc(4),box('iprp',box('ipco',box('ispe',size)))]))]);
}
// These are parser fixtures, not proof of actual HEVC decoding. The browser
// suite separately generates a real HEIC with libheif and decodes its pixels.
test('HEIF preflight recognizes brands and declared dimensions, not extensions',()=>{
  assert.deepEqual(inspectHeif(envelope()),{width:640,height:480});
  assert.equal(inspectHeif(Buffer.from('not a HEIC despite the name')),null);
});
test('HEIF preflight rejects malformed, truncated and oversized containers before decoding',()=>{
  assert.throws(()=>inspectHeif(envelope(6000,5000)),/25 megapixels/);
  assert.throws(()=>inspectHeif(envelope(0,400)),/25 megapixels/);
  assert.throws(()=>inspectHeif(envelope().subarray(0,-2)),/incompleto/);
  const bad=envelope();bad.writeUInt32BE(0xffffffff,0);assert.throws(()=>inspectHeif(bad),/Cabeçalho/);
});
test('AVIF cannot masquerade as the HEIF photo path',()=>{
  const avif=envelope();avif.write('avif',8);assert.equal(inspectHeif(avif),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { isHeif, inspectHeif } from '../src/lib/photos/heif-header.mjs';

function box(type, ...parts) {
  const payload = Buffer.concat(parts);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(payload.length + 8);
  header.write(type, 4, 4, 'ascii');
  return Buffer.concat([header, payload]);
}
function fixture({ width = 4032, height = 3024, brand = 'heic', compatible = 'mif1' } = {}) {
  const ftyp = box('ftyp', Buffer.from(brand), Buffer.alloc(4), Buffer.from(compatible));
  const dimensions = Buffer.alloc(12);
  dimensions.writeUInt32BE(width, 4); dimensions.writeUInt32BE(height, 8);
  return Buffer.concat([ftyp, box('meta', Buffer.alloc(4), box('iprp', box('ipco', box('ispe', dimensions)))), box('mdat', Buffer.from([1, 2, 3]))]);
}

test('HEIF signature is detected from bytes and dimensions checked before decode', () => {
  const bytes = fixture();
  assert.equal(isHeif(bytes), true);
  assert.deepEqual(inspectHeif(bytes), { width: 4032, height: 3024 });
  assert.equal(isHeif(Buffer.from('photo.heic')), false);
  assert.equal(isHeif(fixture({ brand: 'avif' })), false);
  assert.equal(isHeif(fixture({ brand: 'mif1', compatible: 'avif' })), false);
});

test('HEIF rejects sequence, oversized dimensions, truncated data and missing dimensions', () => {
  assert.throws(() => inspectHeif(fixture({ brand: 'msf1' })), /sequência/);
  assert.throws(() => inspectHeif(fixture({ width: 10000, height: 10000 })), /megapixels/);
  assert.throws(() => inspectHeif(fixture({ width: 17000, height: 10 })), /pixels/);
  assert.throws(() => inspectHeif(fixture({ width: 0 })), /megapixels/);
  assert.throws(() => inspectHeif(fixture().subarray(0, 35)), /incompleto|inválid/);
  assert.throws(() => inspectHeif(box('ftyp', Buffer.from('heic'), Buffer.alloc(4), Buffer.from('mif1'))), /dimensões/);
});

test('HEIF cannot bypass pixel budget with a small auxiliary image or malformed boxes', () => {
  const good = fixture();
  const dimensions = Buffer.alloc(12); dimensions.writeUInt32BE(16000, 4); dimensions.writeUInt32BE(16000, 8);
  assert.throws(() => inspectHeif(Buffer.concat([good, box('meta', Buffer.alloc(4), box('iprp', box('ipco', box('ispe', dimensions))))])), /megapixels/);
  const invalid = Buffer.from(good); invalid.writeUInt32BE(7, 20);
  assert.throws(() => inspectHeif(invalid), /incompleto/);
  assert.throws(() => inspectHeif(Buffer.alloc(21 * 1024 * 1024)), /20 MB/);
});

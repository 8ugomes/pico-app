const STILL = new Set(['heic', 'heix', 'heim', 'heis', 'mif1']);
const SEQUENCE = new Set(['hevc', 'hevx', 'hevm', 'hevs', 'msf1']);
const text = (bytes, offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));

export function isHeif(bytes) {
  if (bytes.length < 16 || text(bytes, 4) !== 'ftyp') return false;
  const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
  if (size < 16 || size > bytes.length || size > 4096) return false;
  const brands = [text(bytes, 8)];
  for (let position = 16; position + 4 <= size; position += 4) brands.push(text(bytes, position));
  if (brands.some(brand => brand === 'avif' || brand === 'avis')) return false;
  return brands.some(brand => STILL.has(brand) || SEQUENCE.has(brand));
}

// Bounded structural inspection only; libheif still validates the actual bitstream.
export function inspectHeif(bytes) {
  if (bytes.length > 20 * 1024 * 1024) throw new Error('A foto original deve ter até 20 MB.');
  if (!isHeif(bytes)) throw new Error('Arquivo HEIC/HEIF inválido ou não suportado.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const brandSize = view.getUint32(0);
  const brands = [text(bytes, 8)];
  for (let p = 16; p + 4 <= brandSize; p += 4) brands.push(text(bytes, p));
  if (brands.some(brand => SEQUENCE.has(brand))) throw new Error('Escolha a foto estática, não uma sequência HEIC.');
  let boxes = 0;
  const dimensions = [];
  function walk(start, end, depth) {
    if (depth > 8) throw new Error('Estrutura HEIC muito complexa.');
    let cursor = start;
    while (cursor < end) {
      if (++boxes > 4096 || end - cursor < 8) throw new Error('Estrutura HEIC inválida.');
      let size = view.getUint32(cursor);
      let header = 8;
      if (size === 1) {
        if (end - cursor < 16) throw new Error('Arquivo HEIC incompleto.');
        const wide = view.getBigUint64(cursor + 8);
        if (wide > BigInt(end - cursor)) throw new Error('Arquivo HEIC incompleto.');
        size = Number(wide);
        header = 16;
      } else if (size === 0) size = end - cursor;
      if (size < header || cursor + size > end) throw new Error('Arquivo HEIC incompleto.');
      const kind = text(bytes, cursor + 4);
      const payload = cursor + header;
      const stop = cursor + size;
      if (kind === 'ispe') {
        if (stop - payload < 12) throw new Error('Dimensões HEIC inválidas.');
        const width = view.getUint32(payload + 4), height = view.getUint32(payload + 8);
        if (!width || !height || width > 16000 || height > 16000 || width * height > 25000000) throw new Error('Use uma foto com até 25 megapixels e 16.000 pixels por lado.');
        dimensions.push({ width, height });
      } else if (kind === 'meta') {
        if (stop - payload < 4) throw new Error('Metadados HEIC incompletos.');
        walk(payload + 4, stop, depth + 1);
      } else if (kind === 'iprp' || kind === 'ipco') walk(payload, stop, depth + 1);
      cursor = stop;
    }
  }
  walk(0, bytes.length, 0);
  if (!dimensions.length) throw new Error('Não foi possível conferir as dimensões desta foto HEIC.');
  return dimensions.reduce((largest, item) => item.width * item.height > largest.width * largest.height ? item : largest);
}

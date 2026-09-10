import { inspectHeif, isHeif } from './heif-header.mjs';

export const ORIGINAL_LIMIT = 20 * 1024 * 1024;
export const PIXEL_LIMIT = 25_000_000;
export const UPLOAD_LIMIT = 3 * 1024 * 1024;
export type CropArea = { x: number; y: number; width: number; height: number };

export function inspectImage(bytes: Uint8Array): { width: number; height: number; format: 'jpeg' | 'png' | 'webp' } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, count: number) => String.fromCharCode(...bytes.subarray(offset, offset + count));
  let width = 0, height = 0;
  let format: 'jpeg' | 'png' | 'webp';
  if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
    format = 'png'; width = view.getUint32(16); height = view.getUint32(20);
    for (let position = 8; position + 12 <= bytes.length;) {
      const size = view.getUint32(position);
      if (text(position + 4, 4) === 'acTL') throw new Error('Use uma foto estática, sem animação.');
      if (size > bytes.length - position - 12) break;
      position += size + 12;
    }
  } else if (bytes.length >= 30 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    format = 'webp';
    const kind = text(12, 4);
    if (kind === 'VP8X') {
      if (bytes[20] & 2) throw new Error('Use uma foto estática, sem animação.');
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === 'VP8 ') {
      if (text(23, 3) !== '\x9d\x01\x2a') throw new Error('Foto WebP inválida.');
      width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff;
    } else if (kind === 'VP8L' && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = 1 + (bits & 0x3fff); height = 1 + ((bits >>> 14) & 0x3fff);
    }
  } else if (bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216) {
    format = 'jpeg';
    let position = 2;
    while (position + 4 <= bytes.length) {
      if (bytes[position] !== 255) break;
      while (bytes[position] === 255) position++;
      const marker = bytes[position++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (position + 2 > bytes.length) break;
      const size = view.getUint16(position);
      if (size < 2 || position + size > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && size >= 7) {
        height = view.getUint16(position + 3); width = view.getUint16(position + 5); break;
      }
      position += size;
    }
  } else throw new Error('Formato não suportado ou arquivo inválido. Escolha uma foto JPEG, PNG, WebP ou HEIC/HEIF estática.');
  if (!width || !height || width > 16000 || height > 16000 || width * height > PIXEL_LIMIT) throw new Error('Use uma foto com até 25 megapixels e 16.000 pixels por lado.');
  return { width, height, format };
}

export function rotationBounds(width: number, height: number, rotation: number) {
  const radians = rotation * Math.PI / 180;
  return { width: Math.ceil(Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height - 1e-8), height: Math.ceil(Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height - 1e-8) };
}

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Não foi possível processar a foto.')), 'image/webp', quality));
}

export async function preparePhoto(file: File, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!file.size || file.size > ORIGINAL_LIMIT) throw new Error('O original deve ter entre 1 byte e 20 MB. Exporte uma versão menor.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const heif = isHeif(bytes);
  if (heif) inspectHeif(bytes);
  else inspectImage(bytes); // Detect actual contents, including JPEG returned by an iOS picker.
  signal?.throwIfAborted();
  if (typeof createImageBitmap !== 'function') throw new Error('Abra no Safari ou Chrome atualizado para ajustar esta foto.');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    signal?.throwIfAborted();
    if (!heif) throw new Error('Não foi possível ler esta foto. Tente outro arquivo.');
    const { decodeHeic } = await import('./heic-browser');
    bitmap = await decodeHeic(file, signal);
  }
  const canvas = document.createElement('canvas');
  try {
    signal?.throwIfAborted();
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > PIXEL_LIMIT || bitmap.width > 16000 || bitmap.height > 16000) throw new Error('Foto acima do limite de pixels.');
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Editor indisponível.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = await toBlob(canvas, .94);
    signal?.throwIfAborted();
    return { url: URL.createObjectURL(result), width: canvas.width, height: canvas.height };
  } finally { bitmap.close(); canvas.width = canvas.height = 1; }
}

export async function renderCrop(url: string, area: CropArea, rotation: number, maxSide: number) {
  if (![area.x, area.y, area.width, area.height, rotation, maxSide].every(Number.isFinite) || area.width <= 0 || area.height <= 0 || maxSide <= 0) throw new Error('Enquadramento inválido. Ajuste a foto novamente.');
  const response = await fetch(url);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas'), output = document.createElement('canvas');
  try {
    const bounds = rotationBounds(bitmap.width, bitmap.height, rotation);
    canvas.width = bounds.width; canvas.height = bounds.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Editor indisponível.');
    context.translate(bounds.width / 2, bounds.height / 2);
    context.rotate(rotation * Math.PI / 180);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
    output.width = Math.max(1, Math.round(area.width * scale)); output.height = Math.max(1, Math.round(area.height * scale));
    const target = output.getContext('2d');
    if (!target) throw new Error('Editor indisponível.');
    target.drawImage(canvas, area.x, area.y, area.width, area.height, 0, 0, output.width, output.height);
    let result = await toBlob(output, .88);
    if (result.size > UPLOAD_LIMIT) result = await toBlob(output, .7);
    if (result.size > UPLOAD_LIMIT) throw new Error('O recorte ainda está grande. Escolha uma área menor.');
    return result;
  } finally { bitmap.close(); canvas.width = canvas.height = output.width = output.height = 1; }
}

export const ORIGINAL_LIMIT=20*1024*1024,PIXEL_LIMIT=25_000_000,UPLOAD_LIMIT=3*1024*1024;
export type CropArea={x:number;y:number;width:number;height:number};
export function inspectImage(bytes:Uint8Array):{width:number;height:number;format:'jpeg'|'png'|'webp'}{
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),text=(o:number,n:number)=>String.fromCharCode(...bytes.subarray(o,o+n));let width=0,height=0,format:'jpeg'|'png'|'webp';
 if(bytes.length>=24&&v.getUint32(0)===0x89504e47&&v.getUint32(4)===0x0d0a1a0a){format='png';width=v.getUint32(16);height=v.getUint32(20);for(let p=8;p+12<=bytes.length;){const size=v.getUint32(p);if(text(p+4,4)==='acTL')throw Error('Use uma foto estática, sem animação.');if(size>bytes.length-p-12)break;p+=size+12;}}
 else if(bytes.length>=30&&text(0,4)==='RIFF'&&text(8,4)==='WEBP'){format='webp';const kind=text(12,4);if(kind==='VP8X'){if(bytes[20]&2)throw Error('Use uma foto estática, sem animação.');width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}else if(kind==='VP8 '){if(text(23,3)!=='\x9d\x01\x2a')throw Error('Foto WebP inválida.');width=v.getUint16(26,true)&0x3fff;height=v.getUint16(28,true)&0x3fff;}else if(kind==='VP8L'&&bytes[20]===0x2f){const bits=v.getUint32(21,true);width=1+(bits&0x3fff);height=1+((bits>>>14)&0x3fff);}}
 else if(bytes.length>4&&bytes[0]===255&&bytes[1]===216){format='jpeg';let p=2;while(p+4<=bytes.length){if(bytes[p]!==255)break;while(bytes[p]===255)p++;const marker=bytes[p++];if(marker===0xda||marker===0xd9)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;const size=v.getUint16(p);if(size<2||p+size>bytes.length)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&size>=7){height=v.getUint16(p+3);width=v.getUint16(p+5);break;}p+=size;}}
 else throw Error('Formato não reconhecido. Use uma foto JPEG, PNG, WebP ou HEIC/HEIF válida.');
 if(!width||!height||width>16000||height>16000||width*height>PIXEL_LIMIT)throw Error('Use uma foto com até 25 megapixels e 16.000 pixels por lado.');
 return{width,height,format};
}
export function rotationBounds(width:number,height:number,rotation:number){const radians=rotation*Math.PI/180;return{width:Math.ceil(Math.abs(Math.cos(radians))*width+Math.abs(Math.sin(radians))*height-1e-8),height:Math.ceil(Math.abs(Math.sin(radians))*width+Math.abs(Math.cos(radians))*height-1e-8)}}
function blob(canvas:HTMLCanvasElement,quality:number){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Não foi possível processar a foto.')),'image/webp',quality))}
/** Validate the ISO-BMFF envelope and declared dimensions before decoding.
 * All ispe properties are bounded, including auxiliary images and grid output.
 * This is a preflight guard, not a replacement for libheif's actual decoder.
 */
export function inspectHeif(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.byteLength < 16) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, size: number) => String.fromCharCode(...bytes.subarray(offset, offset + size));
  if (text(4, 4) !== 'ftyp') return null;
  const ftypLength = view.getUint32(0);
  if (ftypLength < 16 || ftypLength > bytes.byteLength || ftypLength > 4096) throw Error('Cabeçalho HEIC inválido.');
  const brands = [text(8, 4)];
  for (let at = 16; at + 4 <= ftypLength; at += 4) brands.push(text(at, 4));
  if (brands.some(brand => ['avif', 'avis'].includes(brand))) return null;
  if (!brands.some(brand => ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand))) return null;
  let count = 0;
  let largest = { width: 0, height: 0 };
  function boxes(start: number, end: number, depth = 0) {
    if (depth > 6) throw Error('Estrutura HEIC muito complexa.');
    for (let at = start; at < end;) {
      if (++count > 4096 || end - at < 8) throw Error('Estrutura HEIC inválida.');
      let size = view.getUint32(at), header = 8;
      if (size === 1) {
        if (end - at < 16 || view.getUint32(at + 8) !== 0) throw Error('Bloco HEIC inválido.');
        size = view.getUint32(at + 12); header = 16;
      } else if (size === 0) size = end - at;
      if (size < header || size > end - at) throw Error('Arquivo HEIC incompleto.');
      const kind = text(at + 4, 4), body = at + header;
      if (kind === 'meta') {
        if (size < header + 4) throw Error('Metadados HEIC inválidos.');
        boxes(body + 4, at + size, depth + 1);
      } else if (kind === 'iprp' || kind === 'ipco') boxes(body, at + size, depth + 1);
      else if (kind === 'ispe') {
        if (size < header + 12) throw Error('Dimensões HEIC ausentes.');
        const width = view.getUint32(body + 4), height = view.getUint32(body + 8);
        if (!width || !height || width > 16000 || height > 16000 || width * height > PIXEL_LIMIT) throw Error('Use uma foto com até 25 megapixels e 16.000 pixels por lado.');
        if (width * height > largest.width * largest.height) largest = { width, height };
      }
      at += size;
    }
  }
  boxes(ftypLength, bytes.byteLength);
  if (!largest.width) throw Error('Não foi possível validar as dimensões desta foto HEIC.');
  return largest;
}

let activeHeicDecode: Promise<ImageBitmap> | null = null;
async function decodeHeic(file: File, signal?: AbortSignal): Promise<ImageBitmap> {
  if (activeHeicDecode) throw Error('Uma foto ainda está sendo processada. Conclua essa conversão antes de abrir outra.');
  // The CSP build decodes in the package's worker without unsafe-eval. Loaded
  // only when the browser cannot decode a validated HEIF image natively.
  const conversion = import('heic-to/csp').then(({ heicTo }) => heicTo({ blob: file, type: 'bitmap' }));
  activeHeicDecode = conversion;
  void conversion.then(() => { activeHeicDecode = null; }, () => { activeHeicDecode = null; });
  return new Promise<ImageBitmap>((resolve, reject) => {
    let abandoned = false;
    const abort = () => { abandoned = true; cleanup(); reject(new DOMException('Conversão cancelada.', 'AbortError')); };
    const timer = setTimeout(() => {
      abandoned = true; cleanup(); reject(Error('A conversão demorou demais neste dispositivo. Tente uma foto menor.'));
    }, 30000);
    function cleanup() { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    // A timed-out UI must not accept a late result or start parallel decoders.
    // The dependency has no terminate API; its result is closed when it finishes.
    conversion.then(bitmap => {
      cleanup();
      if (abandoned) { bitmap.close(); return; }
      resolve(bitmap);
    }, () => {
      cleanup();
      if (!abandoned) reject(Error('Não foi possível converter esta foto HEIC. O arquivo pode estar incompleto ou usar uma variante não suportada.'));
    });
  });
}

export async function preparePhoto(file: File, options: { signal?: AbortSignal; onProgress?: (text: string) => void } = {}) {
  if (file.size > ORIGINAL_LIMIT) throw Error('O original deve ter até 20 MB. Exporte uma versão menor.');
  if (!file.size) throw Error('Esta foto está vazia. Escolha outro arquivo.');
  const { signal, onProgress } = options;
  signal?.throwIfAborted();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const heif = inspectHeif(bytes);
  if (!heif) inspectImage(bytes);
  if (typeof createImageBitmap !== 'function') throw Error('Abra esta página em um Safari ou Chrome atualizado para ajustar a foto.');
  let bitmap: ImageBitmap;
  if (heif) {
    onProgress?.('Convertendo HEIC no seu dispositivo…');
    try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch { signal?.throwIfAborted(); bitmap = await decodeHeic(file, signal); }
  } else bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  let canvas: HTMLCanvasElement | undefined;
  try {
    signal?.throwIfAborted();
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > PIXEL_LIMIT || bitmap.width > 16000 || bitmap.height > 16000) throw Error('Foto acima do limite de 25 megapixels.');
    onProgress?.('Preparando o enquadramento…');
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('Editor indisponível.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = await blob(canvas, .94);
    signal?.throwIfAborted();
    return { url: URL.createObjectURL(result), width: canvas.width, height: canvas.height };
  } finally { bitmap.close(); if (canvas) canvas.width = canvas.height = 1; }
}
export async function renderCrop(url:string,area:CropArea,rotation:number,maxSide:number){const response=await fetch(url);const bitmap=await createImageBitmap(await response.blob());try{const bounds=rotationBounds(bitmap.width,bitmap.height,rotation),canvas=document.createElement('canvas');canvas.width=bounds.width;canvas.height=bounds.height;const c=canvas.getContext('2d');if(!c)throw Error('Editor indisponível.');c.translate(bounds.width/2,bounds.height/2);c.rotate(rotation*Math.PI/180);c.drawImage(bitmap,-bitmap.width/2,-bitmap.height/2);const output=document.createElement('canvas'),scale=Math.min(1,maxSide/Math.max(area.width,area.height));output.width=Math.max(1,Math.round(area.width*scale));output.height=Math.max(1,Math.round(area.height*scale));const target=output.getContext('2d');if(!target)throw Error('Editor indisponível.');target.drawImage(canvas,area.x,area.y,area.width,area.height,0,0,output.width,output.height);canvas.width=canvas.height=1;let result=await blob(output,.88);if(result.size>UPLOAD_LIMIT)result=await blob(output,.7);output.width=output.height=1;if(result.size>UPLOAD_LIMIT)throw Error('O recorte ainda está grande. Escolha uma área menor.');return result;}finally{bitmap.close();}}

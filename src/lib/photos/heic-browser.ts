'use client';

export function decodeHeic(blob: Blob, signal?: AbortSignal): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    let worker: Worker;
    try { worker = new Worker(new URL('./heic.worker.ts', import.meta.url), { type: 'module' }); }
    catch { reject(new Error('Não foi possível iniciar o conversor HEIC neste navegador.')); return; }
    let finished = false;
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.terminate();
    };
    const fail = (error: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };
    const abort = () => fail(new DOMException('Cancelled', 'AbortError'));
    timer = setTimeout(() => fail(new Error('A conversão demorou além do limite. Tente uma foto menor.')), 30000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onerror = event => {
      event.preventDefault();
      fail(new Error('Não foi possível converter esta foto HEIC neste navegador.'));
    };
    worker.onmessage = (event: MessageEvent<{ bitmap?: ImageBitmap; error?: string }>) => {
      const bitmap = event.data.bitmap;
      if (finished) { bitmap?.close(); return; }
      if (!(bitmap instanceof ImageBitmap)) { fail(new Error(event.data.error || 'Foto HEIC inválida.')); return; }
      finished = true;
      cleanup();
      resolve(bitmap);
    };
    try { worker.postMessage({ blob }); }
    catch { fail(new Error('Não foi possível abrir a foto no conversor.')); }
  });
}

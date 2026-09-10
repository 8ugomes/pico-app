import { heicTo } from 'heic-to/csp';
import { inspectHeif } from './heif-header.mjs';

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<{ blob: Blob }>) => void) | null;
  postMessage: (value: unknown, transfer?: Transferable[]) => void;
};

scope.onmessage = async (event) => {
  let bitmap: ImageBitmap | undefined;
  try {
    const { blob } = event.data;
    inspectHeif(new Uint8Array(await blob.arrayBuffer()));
    const decoded = await heicTo({ blob, type: 'bitmap' });
    if (!(decoded instanceof ImageBitmap)) throw new Error('Invalid decoded image');
    bitmap = decoded;
    if (!bitmap.width || !bitmap.height || bitmap.width > 16000 || bitmap.height > 16000 || bitmap.width * bitmap.height > 25000000) throw new Error('Image exceeds budget');
    scope.postMessage({ bitmap }, [bitmap]);
    bitmap = undefined; // ownership transferred to the caller
  } catch {
    bitmap?.close();
    scope.postMessage({ error: 'Não foi possível converter esta foto HEIC. Tente outra foto ou uma cópia JPEG.' });
  }
};

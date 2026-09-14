import { chromium } from '@playwright/test';

// A short, genuine H.264/MP4 recording made locally by Chrome. The hosted
// media gate uses this instead of an ftyp-only placeholder, then plays it back.
export async function realMp4Fixture() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const bytes = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 96; canvas.height = 64;
      const context = canvas.getContext('2d');
      const stream = canvas.captureStream(10);
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/mp4;codecs=avc1.42E01E' });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = reject;
      });
      let frame = 0;
      const draw = () => {
        context.fillStyle = frame++ % 2 ? '#44342f' : '#f2e3b5';
        context.fillRect(0, 0, canvas.width, canvas.height);
      };
      draw();
      recorder.start();
      const timer = setInterval(draw, 100);
      await new Promise(resolve => setTimeout(resolve, 900));
      clearInterval(timer);
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());
      return [...new Uint8Array(await new Blob(chunks, { type: 'video/mp4' }).arrayBuffer())];
    });
    return Buffer.from(bytes);
  } finally { await browser.close(); }
}

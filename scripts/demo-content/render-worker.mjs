/** Worker: render + mã hoá MP3 một bài hát (chạy song song nhiều worker). */
import { parentPort } from 'node:worker_threads';
import { writeFileSync } from 'node:fs';
import { renderTrack, encodeMp3 } from './synth.mjs';

parentPort.on('message', ({ spec, outFile, kbps }) => {
  try {
    const started = Date.now();
    const { left, right, durationSec } = renderTrack(spec);
    const mp3 = encodeMp3(left, right, kbps);
    writeFileSync(outFile, mp3);
    parentPort.postMessage({ ok: true, id: spec.id, durationSec, bytes: mp3.length, ms: Date.now() - started });
  } catch (error) {
    parentPort.postMessage({ ok: false, id: spec.id, error: String(error?.stack ?? error) });
  }
});

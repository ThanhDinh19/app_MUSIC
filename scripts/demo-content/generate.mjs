/**
 * Sinh toàn bộ nội dung demo:
 *   - Nhạc MP3 (tự tổng hợp)     → server/storage/media/audio
 *   - Ảnh bìa, ảnh nghệ sĩ (JPG) → server/storage/media/{covers,artists}
 *   - Icon PWA (PNG/SVG)         → client/public
 *   - Dữ liệu seed (JSON)        → server/storage/seed
 *
 * Dùng:  npm run content:generate                 (bỏ qua bài đã có file MP3)
 *        npm run content:generate -- --force      (render lại tất cả)
 *        npm run content:generate -- --skip-audio (chỉ vẽ ảnh + ghi JSON)
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';
import { moods, genres, artists, albums, editorialPlaylists } from './catalog.mjs';
import { buildArrangement, computeDurationSec, createRng, hashString } from './synth.mjs';
import { albumCoverSvg, abstractCoverSvg, artistSvg, logoSvg } from './art.mjs';
import { lyrics } from './lyrics.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const STORAGE = join(ROOT, 'server/storage');
const MEDIA = join(STORAGE, 'media');
const SEED = join(STORAGE, 'seed');
const PUBLIC = join(ROOT, 'client/public');

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const SKIP_AUDIO = args.has('--skip-audio');
const KBPS = 128;
const CREATED_AT = '2026-10-01T00:00:00.000Z';

for (const dir of ['audio', 'covers/albums', 'covers/playlists', 'covers/moods', 'covers/genres', 'artists']) {
  mkdirSync(join(MEDIA, dir), { recursive: true });
}
mkdirSync(SEED, { recursive: true });
mkdirSync(join(PUBLIC, 'icons'), { recursive: true });

const log = (...m) => console.log('•', ...m);

async function svgToJpg(svgString, file, size) {
  await sharp(Buffer.from(svgString)).resize(size, size).jpeg({ quality: 84, mozjpeg: true }).toFile(file);
}

async function svgToPng(svgString, file, size) {
  await sharp(Buffer.from(svgString)).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
}

/* ------------------------------ Ảnh ------------------------------ */

async function generateArt() {
  const moodById = Object.fromEntries(moods.map((m) => [m.id, m]));
  const jobs = [];
  for (const album of albums) jobs.push(svgToJpg(albumCoverSvg(album), join(MEDIA, 'covers/albums', `${album.id}.jpg`), 640));
  for (const artist of artists) jobs.push(svgToJpg(artistSvg(artist), join(MEDIA, 'artists', `${artist.id}.jpg`), 800));
  for (const mood of moods) jobs.push(svgToJpg(abstractCoverSvg(`mood-${mood.id}`, mood.color, '#7a5cff'), join(MEDIA, 'covers/moods', `${mood.id}.jpg`), 480));
  for (const genre of genres) jobs.push(svgToJpg(abstractCoverSvg(`genre-${genre.id}`, genre.color, '#2f7bff'), join(MEDIA, 'covers/genres', `${genre.id}.jpg`), 480));
  for (const pl of editorialPlaylists) {
    const color = moodById[pl.moodId]?.color ?? '#7a5cff';
    jobs.push(svgToJpg(abstractCoverSvg(`playlist-${pl.id}`, color, '#ff5fa2'), join(MEDIA, 'covers/playlists', `${pl.id}.jpg`), 640));
  }
  await Promise.all(jobs);
  log(`Đã vẽ ${jobs.length} ảnh`);
}

async function generateIcons() {
  writeFileSync(join(PUBLIC, 'favicon.svg'), logoSvg({ size: 512 }));
  await Promise.all([
    svgToPng(logoSvg({ size: 512 }), join(PUBLIC, 'icons/pwa-192.png'), 192),
    svgToPng(logoSvg({ size: 512 }), join(PUBLIC, 'icons/pwa-512.png'), 512),
    svgToPng(logoSvg({ size: 512, padding: 0.14, rounded: false }), join(PUBLIC, 'icons/maskable-512.png'), 512),
    svgToPng(logoSvg({ size: 512, padding: 0.08, rounded: false }), join(PUBLIC, 'icons/apple-touch-icon.png'), 180),
    svgToPng(logoSvg({ size: 512 }), join(PUBLIC, 'icons/favicon-32.png'), 32),
  ]);
  log('Đã tạo icon PWA');
}

/* ------------------------------ Nhạc ----------------------------- */

async function generateAudio() {
  const specs = albums.flatMap((album) => album.songs.map((s) => ({ id: s.id, ...s.music })));
  const todo = specs.filter((spec) => FORCE || !existsSync(join(MEDIA, 'audio', `${spec.id}.mp3`)));
  if (todo.length === 0) {
    log('Tất cả file MP3 đã có sẵn (dùng --force để render lại)');
    return;
  }
  const poolSize = Math.max(1, Math.min(todo.length, availableParallelism() - 1));
  log(`Đang tổng hợp ${todo.length} bài hát với ${poolSize} worker...`);
  let next = 0;
  let done = 0;
  await new Promise((resolveAll, rejectAll) => {
    const workers = [];
    const dispatch = (worker) => {
      if (next >= todo.length) {
        worker.terminate();
        return;
      }
      const spec = todo[next++];
      worker.postMessage({ spec, outFile: join(MEDIA, 'audio', `${spec.id}.mp3`), kbps: KBPS });
    };
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(new URL('./render-worker.mjs', import.meta.url));
      worker.on('message', (msg) => {
        if (!msg.ok) {
          workers.forEach((w) => w.terminate());
          rejectAll(new Error(`Render lỗi ${msg.id}: ${msg.error}`));
          return;
        }
        done++;
        log(`[${done}/${todo.length}] ${msg.id} — ${msg.durationSec.toFixed(0)}s, ${(msg.bytes / 1e6).toFixed(2)} MB (${(msg.ms / 1000).toFixed(1)}s)`);
        if (done === todo.length) resolveAll();
        dispatch(worker);
      });
      worker.on('error', rejectAll);
      workers.push(worker);
      dispatch(worker);
    }
  });
}

/* ----------------------------- Seed JSON ---------------------------- */

function writeSeed(name, data) {
  writeFileSync(join(SEED, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
}

function generateSeed() {
  const artistById = Object.fromEntries(artists.map((a) => [a.id, a]));

  writeSeed('moods', moods.map((m, i) => ({ ...m, sortOrder: i, coverPath: `covers/moods/${m.id}.jpg` })));
  writeSeed('genres', genres.map((g, i) => ({ ...g, sortOrder: i, coverPath: `covers/genres/${g.id}.jpg` })));
  writeSeed(
    'artists',
    artists.map(({ art, ...a }) => ({ ...a, imagePath: `artists/${a.id}.jpg`, createdAt: CREATED_AT })),
  );
  writeSeed(
    'albums',
    albums.map(({ art, songs, ...a }) => ({ ...a, coverPath: `covers/albums/${a.id}.jpg`, createdAt: CREATED_AT })),
  );
  writeSeed(
    'songs',
    albums.flatMap((album) =>
      album.songs.map((s, i) => {
        const rng = createRng(hashString(`plays-${s.id}`));
        const listeners = artistById[album.artistId].monthlyListeners;
        return {
          id: s.id,
          title: s.title,
          artistId: album.artistId,
          albumId: album.id,
          trackNumber: i + 1,
          durationSec: Math.round(computeDurationSec({ id: s.id, ...s.music })),
          audioPath: `audio/${s.id}.mp3`,
          moodId: s.moodId,
          genreId: album.genreId,
          plays: Math.round(listeners * rng.range(0.3, 3.4)),
          releaseDate: album.releaseDate,
          createdAt: CREATED_AT,
        };
      }),
    ),
  );
  writeSeed(
    'playlists',
    editorialPlaylists.map(({ moodId, ...p }) => ({
      ...p,
      ownerId: null,
      coverPath: `covers/playlists/${p.id}.jpg`,
      isPublic: true,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    })),
  );
  writeSeed('lyrics', generateLyrics(artistById));
  for (const empty of ['users', 'favorites', 'saved-albums', 'followed-artists', 'play-history']) writeSeed(empty, []);
  log(`Đã ghi dữ liệu seed vào ${SEED}`);
}

/* ------------------------- Lời bài hát (đồng bộ) ------------------------- */

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Canh thời gian lời theo cấu trúc bài nhạc đã tổng hợp:
 *   intro/outro (và break không có bridge) → dòng trống = khoảng nhạc dạo,
 *   A → verse (nối tiếp verse2), B → chorus (mỗi lượt điệp khúc hát lại từ đầu), break → bridge.
 * Mỗi dòng bắt đầu đúng đầu ô nhịp; bài nhanh (ô nhịp < 2.4s) thì mỗi dòng kéo dài 2 ô nhịp.
 */
function layoutLyrics(spec, text) {
  const arr = buildArrangement(spec);
  const sections = [];
  for (const bar of arr.bars) {
    const last = sections.at(-1);
    if (last && last.index === bar.sectionIndex) last.bars++;
    else sections.push({ name: bar.section, index: bar.sectionIndex, start: bar.start, bars: 1 });
  }
  const barsPerLine = arr.barSec >= 2.4 ? 1 : 2;
  const verse = [...text.verse, ...(text.verse2 ?? [])];
  const lines = [];
  const pushGap = (time) => {
    if (lines.at(-1)?.text !== '') lines.push({ time: round2(time), text: '' });
  };
  let verseCursor = 0;
  let chorusCursor = 0;
  let previous = null;

  for (const s of sections) {
    if (s.name === 'A' || s.name === 'B') {
      if (s.name === 'B' && previous !== 'B') chorusCursor = 0;
      const slots = Math.max(1, Math.floor(s.bars / barsPerLine));
      for (let k = 0; k < slots; k++) {
        const textLine = s.name === 'A' ? verse[verseCursor++ % verse.length] : text.chorus[chorusCursor++ % text.chorus.length];
        lines.push({ time: round2(s.start + k * barsPerLine * arr.barSec), text: textLine });
      }
    } else if (s.name === 'break' && text.bridge) {
      const spacing = s.bars / text.bridge.length;
      text.bridge.forEach((textLine, k) => lines.push({ time: round2(s.start + k * spacing * arr.barSec), text: textLine }));
    } else {
      pushGap(s.start);
    }
    previous = s.name;
  }
  return lines;
}

function generateLyrics(artistById) {
  const records = [];
  for (const album of albums) {
    for (const song of album.songs) {
      const text = lyrics[song.id];
      if (!text) continue;
      const spec = { id: song.id, ...song.music };
      records.push({
        songId: song.id,
        language: text.language,
        synced: !text.instrumental,
        instrumental: Boolean(text.instrumental),
        lines: text.instrumental ? [] : layoutLyrics(spec, text),
        writers: [artistById[album.artistId].name],
        updatedAt: CREATED_AT,
      });
    }
  }
  return records;
}

const started = Date.now();
await generateIcons();
await generateArt();
generateSeed();
if (!SKIP_AUDIO) await generateAudio();
log(`Hoàn tất sau ${((Date.now() - started) / 1000).toFixed(1)}s`);

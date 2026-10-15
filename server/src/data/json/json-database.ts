import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AlbumRecord,
  ArtistRecord,
  FavoriteRecord,
  FollowedArtistRecord,
  GenreRecord,
  IdentityRecord,
  LyricsRecord,
  MoodRecord,
  OtpChallengeRecord,
  PlayHistoryRecord,
  PlaylistRecord,
  SavedAlbumRecord,
  SessionRecord,
  SongRecord,
  UserRecord,
} from '../../domain/entities';
import { JsonCollection } from './json-collection';

/** Tên file JSON ↔ tên bảng SQL Server tương ứng sau này. */
const FILES = {
  moods: 'moods',
  genres: 'genres',
  artists: 'artists',
  albums: 'albums',
  songs: 'songs',
  lyrics: 'lyrics',
  users: 'users',
  playlists: 'playlists',
  favorites: 'favorites',
  savedAlbums: 'saved-albums',
  followedArtists: 'followed-artists',
  playHistory: 'play-history',
  identities: 'identities',
  sessions: 'sessions',
  otpChallenges: 'otp-challenges',
} as const;

/** Dữ liệu chỉ phát sinh khi chạy (không có trong seed) → tự tạo mảng rỗng nếu chưa có file. */
const RUNTIME_ONLY = new Set<string>([FILES.identities, FILES.sessions, FILES.otpChallenges]);

export interface JsonDatabase {
  moods: JsonCollection<MoodRecord>;
  genres: JsonCollection<GenreRecord>;
  artists: JsonCollection<ArtistRecord>;
  albums: JsonCollection<AlbumRecord>;
  songs: JsonCollection<SongRecord>;
  lyrics: JsonCollection<LyricsRecord>;
  users: JsonCollection<UserRecord>;
  playlists: JsonCollection<PlaylistRecord>;
  favorites: JsonCollection<FavoriteRecord>;
  savedAlbums: JsonCollection<SavedAlbumRecord>;
  followedArtists: JsonCollection<FollowedArtistRecord>;
  playHistory: JsonCollection<PlayHistoryRecord>;
  identities: JsonCollection<IdentityRecord>;
  sessions: JsonCollection<SessionRecord>;
  otpChallenges: JsonCollection<OtpChallengeRecord>;
  flushAll(): Promise<void>;
}

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * Mở "database" JSON: thư mục `dataDir` chứa dữ liệu đang chạy.
 * File nào chưa có sẽ được sao chép từ `seedDir` (dữ liệu mẫu) → xoá dataDir là reset về ban đầu.
 */
export async function openJsonDatabase(dataDir: string, seedDir: string): Promise<JsonDatabase> {
  await mkdir(dataDir, { recursive: true });

  const collections = {} as Record<keyof typeof FILES, JsonCollection<object>>;
  for (const [key, name] of Object.entries(FILES) as [keyof typeof FILES, string][]) {
    const file = join(dataDir, `${name}.json`);
    if (!(await exists(file))) {
      const seed = join(seedDir, `${name}.json`);
      if (await exists(seed)) {
        await copyFile(seed, file);
      } else if (RUNTIME_ONLY.has(name)) {
        await writeFile(file, '[]\n', 'utf8');
      } else {
        throw new Error(`Thiếu file seed ${seed}. Hãy chạy "npm run content:generate" ở thư mục gốc.`);
      }
    }
    const collection = new JsonCollection<object>(name, file);
    await collection.load();
    collections[key] = collection;
  }

  const db = collections as unknown as Omit<JsonDatabase, 'flushAll'>;
  return {
    ...db,
    flushAll: async () => {
      await Promise.all(Object.values(collections).map((c) => c.flush()));
    },
  };
}

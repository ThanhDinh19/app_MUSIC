/**
 * Hợp đồng tầng lưu trữ (Repository pattern).
 *
 * Service CHỈ làm việc với các interface dưới đây, không biết dữ liệu nằm trong file JSON hay SQL Server.
 * Muốn chuyển sang SQL Server: viết một bộ class mới implement các interface này (src/data/mssql)
 * rồi đổi biến môi trường DATA_PROVIDER=mssql — không cần sửa service hay route.
 *
 * Mọi phương thức đều async để tương thích với database thật.
 */
import type { AlbumSort, SongSort } from '@nocturne/shared';
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
} from '../domain/entities';

export interface PageQuery {
  limit?: number;
  offset?: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface SongQuery extends PageQuery {
  artistId?: string;
  albumId?: string;
  moodId?: string;
  genreId?: string;
  /** Tìm theo tiêu đề (không phân biệt hoa thường, dấu tiếng Việt). */
  search?: string;
  sort?: SongSort;
}

export interface AlbumQuery extends PageQuery {
  artistId?: string;
  moodId?: string;
  genreId?: string;
  search?: string;
  sort?: AlbumSort;
}

export interface ArtistQuery extends PageQuery {
  genreId?: string;
  search?: string;
  sort?: 'popular' | 'name';
}

export interface PlaylistQuery extends PageQuery {
  /** `null` = chỉ playlist biên tập; string = playlist của người dùng đó. */
  ownerId?: string | null;
  publicOnly?: boolean;
  search?: string;
  /** Playlist có chứa ít nhất một trong các bài hát này. */
  containsAnySongIds?: string[];
}

export interface AlbumStats {
  songCount: number;
  totalDurationSec: number;
}

export interface SongRepository {
  list(query: SongQuery): Promise<PageResult<SongRecord>>;
  findById(id: string): Promise<SongRecord | null>;
  /** Giữ đúng thứ tự `ids`, bỏ qua id không tồn tại. */
  findByIds(ids: readonly string[]): Promise<SongRecord[]>;
  incrementPlays(id: string, by?: number): Promise<void>;
  countBy(field: 'moodId' | 'genreId'): Promise<Map<string, number>>;
  statsByAlbum(albumIds: readonly string[]): Promise<Map<string, AlbumStats>>;
}

export interface AlbumRepository {
  list(query: AlbumQuery): Promise<PageResult<AlbumRecord>>;
  findById(id: string): Promise<AlbumRecord | null>;
  findByIds(ids: readonly string[]): Promise<AlbumRecord[]>;
}

export interface ArtistRepository {
  list(query: ArtistQuery): Promise<PageResult<ArtistRecord>>;
  findById(id: string): Promise<ArtistRecord | null>;
  findByIds(ids: readonly string[]): Promise<ArtistRecord[]>;
}

export interface MoodRepository {
  list(): Promise<MoodRecord[]>;
  findById(id: string): Promise<MoodRecord | null>;
}

export interface GenreRepository {
  list(): Promise<GenreRecord[]>;
  findById(id: string): Promise<GenreRecord | null>;
}

export interface LyricsRepository {
  findBySongId(songId: string): Promise<LyricsRecord | null>;
  /** Trong các bài được hỏi, bài nào có lời (không tính bản không lời). */
  songIdsWithLyrics(songIds: readonly string[]): Promise<Set<string>>;
  /** Tìm theo nội dung lời (không dấu). Trả về dòng khớp đầu tiên của mỗi bài. */
  search(query: string, limit: number): Promise<{ songId: string; line: string }[]>;
}

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByIds(ids: readonly string[]): Promise<UserRecord[]>;
  create(user: UserRecord): Promise<UserRecord>;
  update(id: string, patch: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord | null>;
  delete(id: string): Promise<void>;
}

export interface IdentityRepository {
  find(provider: IdentityRecord['provider'], providerUserId: string): Promise<IdentityRecord | null>;
  listByUser(userId: string): Promise<IdentityRecord[]>;
  create(identity: IdentityRecord): Promise<IdentityRecord>;
  update(id: string, patch: Partial<Pick<IdentityRecord, 'email' | 'lastLoginAt'>>): Promise<void>;
}

export interface SessionRepository {
  create(session: SessionRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  touch(id: string, lastUsedAt: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteExpired(now: string): Promise<void>;
}

export interface OtpChallengeRepository {
  create(challenge: OtpChallengeRecord): Promise<void>;
  findById(id: string): Promise<OtpChallengeRecord | null>;
  /** Các lần gửi tới số này kể từ thời điểm `since` (mới nhất trước). */
  listByPhoneSince(phone: string, since: string): Promise<OtpChallengeRecord[]>;
  update(id: string, patch: Partial<Pick<OtpChallengeRecord, 'attempts' | 'consumedAt'>>): Promise<void>;
  /** Dọn các mã đã tạo trước thời điểm `before`. */
  deleteOlderThan(before: string): Promise<void>;
}

export interface PlaylistRepository {
  list(query: PlaylistQuery): Promise<PageResult<PlaylistRecord>>;
  findById(id: string): Promise<PlaylistRecord | null>;
  countByOwner(ownerId: string): Promise<number>;
  /** Chuyển toàn bộ playlist sang người dùng khác (gộp dữ liệu khách khi đăng nhập). */
  reassignOwner(fromUserId: string, toUserId: string): Promise<void>;
  create(playlist: PlaylistRecord): Promise<PlaylistRecord>;
  update(id: string, patch: Partial<Omit<PlaylistRecord, 'id' | 'createdAt'>>): Promise<PlaylistRecord | null>;
  delete(id: string): Promise<boolean>;
}

export interface LibraryRepository {
  /** Mới nhất trước. */
  listFavorites(userId: string): Promise<FavoriteRecord[]>;
  addFavorite(userId: string, songId: string): Promise<void>;
  removeFavorite(userId: string, songId: string): Promise<void>;

  listSavedAlbums(userId: string): Promise<SavedAlbumRecord[]>;
  saveAlbum(userId: string, albumId: string): Promise<void>;
  unsaveAlbum(userId: string, albumId: string): Promise<void>;

  listFollowedArtists(userId: string): Promise<FollowedArtistRecord[]>;
  followArtist(userId: string, artistId: string): Promise<void>;
  unfollowArtist(userId: string, artistId: string): Promise<void>;
  countFollowers(artistIds: readonly string[]): Promise<Map<string, number>>;
  /** Gộp yêu thích / album đã lưu / nghệ sĩ theo dõi của `from` vào `to` (bỏ trùng). */
  mergeUser(fromUserId: string, toUserId: string): Promise<void>;
}

export interface HistoryRepository {
  /** Mới nhất trước. */
  list(userId: string, limit: number): Promise<PlayHistoryRecord[]>;
  add(entry: PlayHistoryRecord, maxPerUser: number): Promise<void>;
  clear(userId: string): Promise<void>;
  reassignUser(fromUserId: string, toUserId: string): Promise<void>;
}

export interface Repositories {
  songs: SongRepository;
  albums: AlbumRepository;
  artists: ArtistRepository;
  moods: MoodRepository;
  genres: GenreRepository;
  lyrics: LyricsRepository;
  users: UserRepository;
  identities: IdentityRepository;
  sessions: SessionRepository;
  otpChallenges: OtpChallengeRepository;
  playlists: PlaylistRepository;
  library: LibraryRepository;
  history: HistoryRepository;
  /** Ghi nốt dữ liệu còn chờ / đóng kết nối. */
  close(): Promise<void>;
}

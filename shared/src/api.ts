import type {
  Album,
  Artist,
  Genre,
  HistoryEntry,
  ID,
  Mood,
  Playlist,
  Song,
  UserPreferences,
  UserProfile,
} from './models';

/* ----------------------------- Response chung ----------------------------- */

export interface Paged<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/* ------------------------------- Catalog --------------------------------- */

export type SongSort = 'popular' | 'newest' | 'title' | 'track';
export type AlbumSort = 'newest' | 'title';

export interface MoodShare {
  moodId: ID;
  name: string;
  color: string;
  durationSec: number;
  /** Tỉ lệ phần trăm (0–100), làm tròn. */
  percent: number;
}

export interface AlbumDetail {
  album: Album;
  artist: Artist;
  songs: Song[];
  /** Phân bổ tâm trạng của album theo thời lượng nghe. */
  moodBreakdown: MoodShare[];
  moreFromArtist: Album[];
}

export interface ArtistDetail {
  artist: Artist;
  topSongs: Song[];
  albums: Album[];
  relatedArtists: Artist[];
  playlists: Playlist[];
}

export interface MoodDetail {
  mood: Mood;
  songs: Song[];
  albums: Album[];
}

export interface GenreDetail {
  genre: Genre;
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

export interface PlaylistDetail {
  playlist: Playlist;
  songs: Song[];
  moodBreakdown: MoodShare[];
}

export interface HomeFeed {
  featured: AlbumDetail | null;
  trending: Song[];
  newReleases: Album[];
  moods: Mood[];
  editorialPlaylists: Playlist[];
  artists: Artist[];
  recentlyPlayed: Song[];
}

export interface DiscoverFeed {
  moods: Mood[];
  genres: Genre[];
  artists: Artist[];
  freshSongs: Song[];
}

export type SearchTopResult =
  | { type: 'song'; item: Song }
  | { type: 'album'; item: Album }
  | { type: 'artist'; item: Artist }
  | { type: 'playlist'; item: Playlist };

export interface LyricsMatch {
  song: Song;
  /** Dòng lời chứa từ khoá. */
  line: string;
}

export interface SearchResults {
  query: string;
  topResult: SearchTopResult | null;
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  /** Bài hát có lời khớp từ khoá (tìm theo lời). */
  lyricsMatches: LyricsMatch[];
}

/* ------------------------------- Đăng nhập ------------------------------- */

export interface AuthConfig {
  google: { enabled: boolean; clientId: string | null };
  zalo: {
    enabled: boolean;
    /** `console` = chế độ thử nghiệm (mã in ra terminal server), `zalo` = gửi thật qua Zalo ZNS. */
    mode: 'console' | 'zalo';
  };
}

export interface SendOtpInput {
  phone: string;
}

export interface SendOtpResult {
  challengeId: string;
  phoneMasked: string;
  expiresInSec: number;
  /** Số giây phải chờ trước khi được gửi lại mã. */
  resendInSec: number;
  /** Chỉ có ở chế độ thử nghiệm (không bao giờ trả về ở production). */
  devCode?: string;
}

export interface VerifyOtpInput {
  challengeId: string;
  code: string;
}

export interface GoogleLoginInput {
  /** ID token (JWT) do Google Identity Services trả về. */
  credential: string;
}

export interface AuthResult {
  /** Mã phiên — client gửi lại qua header `Authorization: Bearer <token>`. */
  token: string;
  user: UserProfile;
  isNewUser: boolean;
  /** Dữ liệu của chế độ khách (playlist, yêu thích, lịch sử) đã được chuyển vào tài khoản. */
  mergedGuestData: boolean;
}

/* ------------------------------ Người dùng ------------------------------- */

export interface LibraryIds {
  favoriteSongIds: ID[];
  savedAlbumIds: ID[];
  followedArtistIds: ID[];
}

export interface LibraryOverview {
  favoritesCount: number;
  favoritePreviewCovers: string[];
  recentlyPlayed: Song[];
  playlists: Playlist[];
  savedAlbums: Album[];
  followedArtists: Artist[];
}

export interface UpdateProfileInput {
  displayName?: string;
  preferences?: Partial<UserPreferences>;
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  /** Bài hát đầu tiên (tuỳ chọn) — dùng cho thao tác "Tạo playlist từ bài này". */
  songId?: ID;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
}

export interface AddPlaylistSongInput {
  songId: ID;
}

export interface ReorderPlaylistInput {
  songIds: ID[];
}

export interface RecordPlayInput {
  songId: ID;
}

export type { HistoryEntry };

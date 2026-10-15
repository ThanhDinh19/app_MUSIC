/**
 * Các model (DTO) mà API trả về cho client.
 * Đây là "hợp đồng" giữa frontend và backend — không phụ thuộc vào cách lưu trữ (JSON hay SQL Server).
 */

export type ID = string;

/** Thông tin rút gọn của một tâm trạng, được nhúng sẵn trong bài hát/album để client hiển thị chip màu. */
export interface MoodTag {
  id: ID;
  name: string;
  /** Màu đại diện dạng hex, ví dụ `#5cc8f0`. */
  color: string;
}

export interface Mood extends MoodTag {
  description: string;
  songCount: number;
  coverUrl: string | null;
}

export interface Genre {
  id: ID;
  name: string;
  color: string;
  description: string;
  coverUrl: string | null;
  songCount: number;
}

export interface Artist {
  id: ID;
  name: string;
  bio: string;
  location: string;
  imageUrl: string;
  genres: { id: ID; name: string }[];
  monthlyListeners: number;
  /** Số người theo dõi trong ứng dụng. */
  followers: number;
}

export type AlbumType = 'album' | 'ep' | 'single';

export interface Album {
  id: ID;
  title: string;
  type: AlbumType;
  artistId: ID;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  year: number;
  genre: { id: ID; name: string };
  mood: MoodTag;
  description: string;
  songCount: number;
  totalDurationSec: number;
}

export interface Song {
  id: ID;
  title: string;
  artistId: ID;
  artistName: string;
  albumId: ID;
  albumTitle: string;
  trackNumber: number;
  durationSec: number;
  audioUrl: string;
  coverUrl: string;
  mood: MoodTag;
  genreId: ID;
  plays: number;
  releaseDate: string;
  /** Có lời bài hát (không tính bản không lời). */
  hasLyrics: boolean;
}

export interface LyricLine {
  /** Thời điểm bắt đầu (giây). */
  time: number;
  /** Chuỗi rỗng = đoạn nhạc dạo / không lời. */
  text: string;
}

export interface Lyrics {
  songId: ID;
  /** Mã ngôn ngữ, ví dụ `vi`, `en`. */
  language: string;
  /** Có mốc thời gian để chạy theo nhạc hay chỉ là lời thường. */
  synced: boolean;
  instrumental: boolean;
  lines: LyricLine[];
  writers: string[];
}

export interface Playlist {
  id: ID;
  name: string;
  description: string;
  /** Ảnh bìa riêng (playlist biên tập). Playlist cá nhân dùng `previewCovers` để ghép ảnh. */
  coverUrl: string | null;
  previewCovers: string[];
  /** `null` = playlist do hệ thống/biên tập tạo. */
  ownerId: ID | null;
  ownerName: string;
  isEditorial: boolean;
  isPublic: boolean;
  songCount: number;
  totalDurationSec: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  /** Đổi màu nền ứng dụng theo tâm trạng của bài đang phát. */
  moodSync: boolean;
}

/** Phương thức đăng nhập. `zalo` = số điện thoại Zalo + mã OTP gửi qua Zalo. */
export type AuthProvider = 'google' | 'zalo';

export interface UserProfile {
  id: ID;
  /** `guest` = chưa đăng nhập (định danh bằng mã khách trên thiết bị). */
  kind: 'guest' | 'member';
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  email: string | null;
  /** Số điện thoại đã che bớt, ví dụ `091****678`. */
  phone: string | null;
  providers: AuthProvider[];
  createdAt: string;
  preferences: UserPreferences;
}

export interface HistoryEntry {
  id: ID;
  playedAt: string;
  song: Song;
}

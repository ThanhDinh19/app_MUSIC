/**
 * Bản ghi lưu trữ (storage records).
 * Mỗi interface tương ứng một file JSON hiện tại và một bảng SQL Server trong tương lai
 * (xem src/data/mssql/schema.sql). Service chuyển các bản ghi này thành DTO (@nocturne/shared) trả cho client.
 */
import type { AlbumType } from '@nocturne/shared';

export interface MoodRecord {
  id: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
  coverPath: string | null;
}

export interface GenreRecord {
  id: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
  coverPath: string | null;
}

export interface ArtistRecord {
  id: string;
  name: string;
  bio: string;
  location: string;
  imagePath: string;
  genreIds: string[];
  monthlyListeners: number;
  createdAt: string;
}

export interface AlbumRecord {
  id: string;
  title: string;
  type: AlbumType;
  artistId: string;
  releaseDate: string;
  genreId: string;
  moodId: string;
  coverPath: string;
  description: string;
  createdAt: string;
}

export interface SongRecord {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  trackNumber: number;
  durationSec: number;
  /** Đường dẫn tương đối trong thư mục media, ví dụ `audio/glass-hours.mp3`. */
  audioPath: string;
  moodId: string;
  genreId: string;
  plays: number;
  releaseDate: string;
  createdAt: string;
}

export interface LyricsRecord {
  songId: string;
  language: string;
  synced: boolean;
  instrumental: boolean;
  /** Mỗi dòng: thời điểm (giây) + nội dung. Trong SQL Server là bảng SongLyricLines. */
  lines: { time: number; text: string }[];
  writers: string[];
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  kind: 'guest' | 'member';
  displayName: string;
  /** Ảnh đại diện (vd. từ Google). Bản ghi cũ có thể chưa có trường này. */
  avatarUrl?: string | null;
  preferences: { moodSync: boolean };
  createdAt: string;
  lastSeenAt: string;
}

/** Một cách đăng nhập gắn với tài khoản: Google (sub) hoặc số điện thoại Zalo. Bảng SQL: UserIdentities. */
export interface IdentityRecord {
  id: string;
  userId: string;
  provider: 'google' | 'zalo';
  /** Google: `sub` trong ID token. Zalo: số điện thoại dạng 84xxxxxxxxx. */
  providerUserId: string;
  email: string | null;
  createdAt: string;
  lastLoginAt: string;
}

/** Phiên đăng nhập. Chỉ lưu hash của token, không lưu token gốc. Bảng SQL: Sessions. */
export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

/** Một lần gửi mã OTP. Chỉ lưu HMAC của mã. Bảng SQL: OtpChallenges. */
export interface OtpChallengeRecord {
  id: string;
  phone: string;
  codeHash: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

export interface PlaylistRecord {
  id: string;
  /** `null` = playlist biên tập của hệ thống. */
  ownerId: string | null;
  name: string;
  description: string;
  coverPath: string | null;
  /** Thứ tự bài hát. Trong SQL Server sẽ là bảng PlaylistSongs(PlaylistId, SongId, Position). */
  songIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRecord {
  userId: string;
  songId: string;
  createdAt: string;
}

export interface SavedAlbumRecord {
  userId: string;
  albumId: string;
  createdAt: string;
}

export interface FollowedArtistRecord {
  userId: string;
  artistId: string;
  createdAt: string;
}

export interface PlayHistoryRecord {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
}

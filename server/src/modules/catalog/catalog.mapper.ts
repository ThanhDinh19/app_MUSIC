import type { Album, Artist, Genre, Mood, MoodShare, MoodTag, Playlist, Song } from '@nocturne/shared';
import { uniq } from '../../core/text';
import type { Repositories } from '../../data/repositories';
import type {
  AlbumRecord,
  ArtistRecord,
  GenreRecord,
  MoodRecord,
  PlaylistRecord,
  SongRecord,
} from '../../domain/entities';

const FALLBACK_MOOD: MoodTag = { id: 'unknown', name: 'Khác', color: '#9aa3c7' };
const EDITORIAL_OWNER_NAME = 'Nocturne';

/**
 * Chuyển bản ghi lưu trữ → DTO trả cho client:
 * ghép tên nghệ sĩ/album, gắn tâm trạng, đổi đường dẫn media thành URL public.
 */
export class CatalogMapper {
  constructor(
    private readonly repos: Repositories,
    private readonly mediaBaseUrl: string,
  ) {}

  mediaUrl(path: string): string;
  mediaUrl(path: string | null): string | null;
  mediaUrl(path: string | null): string | null {
    return path ? `${this.mediaBaseUrl}/${path}` : null;
  }

  private async moodTags(): Promise<Map<string, MoodTag>> {
    const moods = await this.repos.moods.list();
    return new Map(moods.map((m) => [m.id, { id: m.id, name: m.name, color: m.color }]));
  }

  async songs(records: SongRecord[]): Promise<Song[]> {
    if (records.length === 0) return [];
    const [artists, albums, moods, withLyrics] = await Promise.all([
      this.repos.artists.findByIds(uniq(records.map((r) => r.artistId))),
      this.repos.albums.findByIds(uniq(records.map((r) => r.albumId))),
      this.moodTags(),
      this.repos.lyrics.songIdsWithLyrics(records.map((r) => r.id)),
    ]);
    const artistById = new Map(artists.map((a) => [a.id, a]));
    const albumById = new Map(albums.map((a) => [a.id, a]));
    return records.map((r) => {
      const album = albumById.get(r.albumId);
      return {
        id: r.id,
        title: r.title,
        artistId: r.artistId,
        artistName: artistById.get(r.artistId)?.name ?? 'Không rõ nghệ sĩ',
        albumId: r.albumId,
        albumTitle: album?.title ?? '',
        trackNumber: r.trackNumber,
        durationSec: r.durationSec,
        audioUrl: this.mediaUrl(r.audioPath),
        coverUrl: this.mediaUrl(album?.coverPath ?? null) ?? '',
        mood: moods.get(r.moodId) ?? FALLBACK_MOOD,
        genreId: r.genreId,
        plays: r.plays,
        releaseDate: r.releaseDate,
        hasLyrics: withLyrics.has(r.id),
      };
    });
  }

  async albums(records: AlbumRecord[]): Promise<Album[]> {
    if (records.length === 0) return [];
    const [artists, genres, moods, stats] = await Promise.all([
      this.repos.artists.findByIds(uniq(records.map((r) => r.artistId))),
      this.repos.genres.list(),
      this.moodTags(),
      this.repos.songs.statsByAlbum(records.map((r) => r.id)),
    ]);
    const artistById = new Map(artists.map((a) => [a.id, a]));
    const genreById = new Map(genres.map((g) => [g.id, g]));
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      artistId: r.artistId,
      artistName: artistById.get(r.artistId)?.name ?? 'Không rõ nghệ sĩ',
      coverUrl: this.mediaUrl(r.coverPath),
      releaseDate: r.releaseDate,
      year: Number(r.releaseDate.slice(0, 4)),
      genre: { id: r.genreId, name: genreById.get(r.genreId)?.name ?? r.genreId },
      mood: moods.get(r.moodId) ?? FALLBACK_MOOD,
      description: r.description,
      songCount: stats.get(r.id)?.songCount ?? 0,
      totalDurationSec: stats.get(r.id)?.totalDurationSec ?? 0,
    }));
  }

  async artists(records: ArtistRecord[]): Promise<Artist[]> {
    if (records.length === 0) return [];
    const [genres, followers] = await Promise.all([
      this.repos.genres.list(),
      this.repos.library.countFollowers(records.map((r) => r.id)),
    ]);
    const genreById = new Map(genres.map((g) => [g.id, g]));
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      bio: r.bio,
      location: r.location,
      imageUrl: this.mediaUrl(r.imagePath),
      genres: r.genreIds.map((id) => ({ id, name: genreById.get(id)?.name ?? id })),
      monthlyListeners: r.monthlyListeners,
      followers: followers.get(r.id) ?? 0,
    }));
  }

  async moods(records: MoodRecord[]): Promise<Mood[]> {
    const counts = await this.repos.songs.countBy('moodId');
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      description: r.description,
      coverUrl: this.mediaUrl(r.coverPath),
      songCount: counts.get(r.id) ?? 0,
    }));
  }

  async genres(records: GenreRecord[]): Promise<Genre[]> {
    const counts = await this.repos.songs.countBy('genreId');
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      description: r.description,
      coverUrl: this.mediaUrl(r.coverPath),
      songCount: counts.get(r.id) ?? 0,
    }));
  }

  async playlists(records: PlaylistRecord[]): Promise<Playlist[]> {
    if (records.length === 0) return [];
    const ownerIds = uniq(records.map((r) => r.ownerId).filter((id): id is string => id !== null));
    const [owners, songs] = await Promise.all([
      this.repos.users.findByIds(ownerIds),
      this.repos.songs.findByIds(uniq(records.flatMap((r) => r.songIds))),
    ]);
    const albums = await this.repos.albums.findByIds(uniq(songs.map((s) => s.albumId)));
    const ownerById = new Map(owners.map((u) => [u.id, u]));
    const songById = new Map(songs.map((s) => [s.id, s]));
    const coverByAlbum = new Map(albums.map((a) => [a.id, this.mediaUrl(a.coverPath)]));

    return records.map((r) => {
      const present = r.songIds.map((id) => songById.get(id)).filter((s): s is SongRecord => s !== undefined);
      const previewCovers = uniq(present.map((s) => coverByAlbum.get(s.albumId)).filter((c): c is string => !!c)).slice(0, 4);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        coverUrl: this.mediaUrl(r.coverPath),
        previewCovers,
        ownerId: r.ownerId,
        ownerName: r.ownerId ? (ownerById.get(r.ownerId)?.displayName ?? 'Người dùng') : EDITORIAL_OWNER_NAME,
        isEditorial: r.ownerId === null,
        isPublic: r.isPublic,
        songCount: present.length,
        totalDurationSec: present.reduce((sum, s) => sum + s.durationSec, 0),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }
}

/** Phân bổ tâm trạng theo thời lượng (thẻ "Mood of this album" trong thiết kế). */
export function moodBreakdown(songs: Song[]): MoodShare[] {
  const total = songs.reduce((sum, s) => sum + s.durationSec, 0);
  if (total === 0) return [];
  const byMood = new Map<string, MoodShare>();
  for (const song of songs) {
    const current = byMood.get(song.mood.id) ?? { moodId: song.mood.id, name: song.mood.name, color: song.mood.color, durationSec: 0, percent: 0 };
    current.durationSec += song.durationSec;
    byMood.set(song.mood.id, current);
  }
  return [...byMood.values()]
    .map((share) => ({ ...share, percent: Math.round((share.durationSec / total) * 100) }))
    .sort((a, b) => b.durationSec - a.durationSec);
}

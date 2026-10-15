import { normalizeText } from '../../core/text';
import type { AlbumRecord, ArtistRecord, GenreRecord, LyricsRecord, MoodRecord, SongRecord } from '../../domain/entities';
import type {
  AlbumQuery,
  AlbumRepository,
  AlbumStats,
  ArtistQuery,
  ArtistRepository,
  GenreRepository,
  LyricsRepository,
  MoodRepository,
  PageResult,
  SongQuery,
  SongRepository,
} from '../repositories';
import type { JsonCollection } from './json-collection';
import { byIdsInOrder, clone, paginate } from './paging';

const matches = (text: string, search?: string) => !search || normalizeText(text).includes(normalizeText(search));

export class JsonSongRepository implements SongRepository {
  constructor(private readonly songs: JsonCollection<SongRecord>) {}

  async list(query: SongQuery): Promise<PageResult<SongRecord>> {
    const items = this.songs.filter(
      (s) =>
        (!query.artistId || s.artistId === query.artistId) &&
        (!query.albumId || s.albumId === query.albumId) &&
        (!query.moodId || s.moodId === query.moodId) &&
        (!query.genreId || s.genreId === query.genreId) &&
        matches(s.title, query.search),
    );
    switch (query.sort ?? 'popular') {
      case 'popular':
        items.sort((a, b) => b.plays - a.plays);
        break;
      case 'newest':
        items.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.trackNumber - b.trackNumber);
        break;
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
        break;
      case 'track':
        items.sort((a, b) => a.albumId.localeCompare(b.albumId) || a.trackNumber - b.trackNumber);
        break;
    }
    return paginate(items.map(clone), query);
  }

  async findById(id: string): Promise<SongRecord | null> {
    const song = this.songs.find((s) => s.id === id);
    return song ? clone(song) : null;
  }

  async findByIds(ids: readonly string[]): Promise<SongRecord[]> {
    return byIdsInOrder(this.songs.all(), ids);
  }

  async incrementPlays(id: string, by = 1): Promise<void> {
    this.songs.update(
      (s) => s.id === id,
      (s) => ({ ...s, plays: s.plays + by }),
    );
  }

  async countBy(field: 'moodId' | 'genreId'): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    for (const song of this.songs.all()) counts.set(song[field], (counts.get(song[field]) ?? 0) + 1);
    return counts;
  }

  async statsByAlbum(albumIds: readonly string[]): Promise<Map<string, AlbumStats>> {
    const wanted = new Set(albumIds);
    const stats = new Map<string, AlbumStats>();
    for (const song of this.songs.all()) {
      if (!wanted.has(song.albumId)) continue;
      const current = stats.get(song.albumId) ?? { songCount: 0, totalDurationSec: 0 };
      stats.set(song.albumId, { songCount: current.songCount + 1, totalDurationSec: current.totalDurationSec + song.durationSec });
    }
    return stats;
  }
}

export class JsonAlbumRepository implements AlbumRepository {
  constructor(private readonly albums: JsonCollection<AlbumRecord>) {}

  async list(query: AlbumQuery): Promise<PageResult<AlbumRecord>> {
    const items = this.albums.filter(
      (a) =>
        (!query.artistId || a.artistId === query.artistId) &&
        (!query.moodId || a.moodId === query.moodId) &&
        (!query.genreId || a.genreId === query.genreId) &&
        matches(a.title, query.search),
    );
    if ((query.sort ?? 'newest') === 'newest') items.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    else items.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return paginate(items.map(clone), query);
  }

  async findById(id: string): Promise<AlbumRecord | null> {
    const album = this.albums.find((a) => a.id === id);
    return album ? clone(album) : null;
  }

  async findByIds(ids: readonly string[]): Promise<AlbumRecord[]> {
    return byIdsInOrder(this.albums.all(), ids);
  }
}

export class JsonArtistRepository implements ArtistRepository {
  constructor(private readonly artists: JsonCollection<ArtistRecord>) {}

  async list(query: ArtistQuery): Promise<PageResult<ArtistRecord>> {
    const items = this.artists.filter(
      (a) => (!query.genreId || a.genreIds.includes(query.genreId)) && matches(a.name, query.search),
    );
    if ((query.sort ?? 'popular') === 'popular') items.sort((a, b) => b.monthlyListeners - a.monthlyListeners);
    else items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return paginate(items.map(clone), query);
  }

  async findById(id: string): Promise<ArtistRecord | null> {
    const artist = this.artists.find((a) => a.id === id);
    return artist ? clone(artist) : null;
  }

  async findByIds(ids: readonly string[]): Promise<ArtistRecord[]> {
    return byIdsInOrder(this.artists.all(), ids);
  }
}

export class JsonLyricsRepository implements LyricsRepository {
  constructor(private readonly lyrics: JsonCollection<LyricsRecord>) {}

  async findBySongId(songId: string): Promise<LyricsRecord | null> {
    const record = this.lyrics.find((l) => l.songId === songId);
    return record ? clone(record) : null;
  }

  async songIdsWithLyrics(songIds: readonly string[]): Promise<Set<string>> {
    const wanted = new Set(songIds);
    return new Set(
      this.lyrics
        .filter((l) => wanted.has(l.songId) && !l.instrumental && l.lines.some((line) => line.text))
        .map((l) => l.songId),
    );
  }

  async search(query: string, limit: number): Promise<{ songId: string; line: string }[]> {
    const q = normalizeText(query);
    if (q.length < 2) return [];
    const results: { songId: string; line: string }[] = [];
    for (const record of this.lyrics.all()) {
      const hit = record.lines.find((line) => line.text && normalizeText(line.text).includes(q));
      if (hit) results.push({ songId: record.songId, line: hit.text });
      if (results.length >= limit) break;
    }
    return results;
  }
}

export class JsonMoodRepository implements MoodRepository {
  constructor(private readonly moods: JsonCollection<MoodRecord>) {}

  async list(): Promise<MoodRecord[]> {
    return [...this.moods.all()].sort((a, b) => a.sortOrder - b.sortOrder).map(clone);
  }

  async findById(id: string): Promise<MoodRecord | null> {
    const mood = this.moods.find((m) => m.id === id);
    return mood ? clone(mood) : null;
  }
}

export class JsonGenreRepository implements GenreRepository {
  constructor(private readonly genres: JsonCollection<GenreRecord>) {}

  async list(): Promise<GenreRecord[]> {
    return [...this.genres.all()].sort((a, b) => a.sortOrder - b.sortOrder).map(clone);
  }

  async findById(id: string): Promise<GenreRecord | null> {
    const genre = this.genres.find((g) => g.id === id);
    return genre ? clone(genre) : null;
  }
}

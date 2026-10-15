import type {
  Album,
  AlbumDetail,
  AlbumSort,
  Artist,
  ArtistDetail,
  Genre,
  GenreDetail,
  Lyrics,
  Mood,
  MoodDetail,
  Paged,
  Song,
  SongSort,
} from '@nocturne/shared';
import { notFound } from '../../core/http-error';
import type { Repositories } from '../../data/repositories';
import { type CatalogMapper, moodBreakdown } from './catalog.mapper';

export interface SongListQuery {
  artistId?: string;
  albumId?: string;
  moodId?: string;
  genreId?: string;
  q?: string;
  sort?: SongSort;
  limit: number;
  offset: number;
}

export interface AlbumListQuery {
  artistId?: string;
  moodId?: string;
  genreId?: string;
  sort?: AlbumSort;
  limit: number;
  offset: number;
}

export interface ArtistListQuery {
  genreId?: string;
  sort?: 'popular' | 'name';
  limit: number;
  offset: number;
}

/** Nghiệp vụ "danh mục nhạc": bài hát, album, nghệ sĩ, tâm trạng, thể loại. */
export class CatalogService {
  constructor(
    private readonly repos: Repositories,
    private readonly mapper: CatalogMapper,
  ) {}

  async listSongs(query: SongListQuery): Promise<Paged<Song>> {
    const { q, ...rest } = query;
    const { items, total } = await this.repos.songs.list({ ...rest, search: q });
    return { items: await this.mapper.songs(items), total, limit: query.limit, offset: query.offset };
  }

  async getSong(id: string): Promise<Song> {
    const record = await this.repos.songs.findById(id);
    if (!record) throw notFound('bài hát');
    const [song] = await this.mapper.songs([record]);
    return song!;
  }

  async getLyrics(songId: string): Promise<Lyrics> {
    const [song, record] = await Promise.all([this.repos.songs.findById(songId), this.repos.lyrics.findBySongId(songId)]);
    if (!song) throw notFound('bài hát');
    if (!record) throw notFound('lời của bài hát này');
    return {
      songId: record.songId,
      language: record.language,
      synced: record.synced,
      instrumental: record.instrumental,
      lines: [...record.lines].sort((a, b) => a.time - b.time),
      writers: record.writers,
    };
  }

  async listAlbums(query: AlbumListQuery): Promise<Paged<Album>> {
    const { items, total } = await this.repos.albums.list(query);
    return { items: await this.mapper.albums(items), total, limit: query.limit, offset: query.offset };
  }

  async getAlbumDetail(id: string): Promise<AlbumDetail> {
    const record = await this.repos.albums.findById(id);
    if (!record) throw notFound('album');
    const [artistRecord, songRecords, otherAlbums] = await Promise.all([
      this.repos.artists.findById(record.artistId),
      this.repos.songs.list({ albumId: id, sort: 'track', limit: 500 }),
      this.repos.albums.list({ artistId: record.artistId, sort: 'newest', limit: 12 }),
    ]);
    if (!artistRecord) throw notFound('nghệ sĩ của album');
    const [[album], [artist], songs, moreFromArtist] = await Promise.all([
      this.mapper.albums([record]),
      this.mapper.artists([artistRecord]),
      this.mapper.songs(songRecords.items),
      this.mapper.albums(otherAlbums.items.filter((a) => a.id !== id)),
    ]);
    return { album: album!, artist: artist!, songs, moodBreakdown: moodBreakdown(songs), moreFromArtist };
  }

  async listArtists(query: ArtistListQuery): Promise<Paged<Artist>> {
    const { items, total } = await this.repos.artists.list(query);
    return { items: await this.mapper.artists(items), total, limit: query.limit, offset: query.offset };
  }

  async getArtistDetail(id: string): Promise<ArtistDetail> {
    const record = await this.repos.artists.findById(id);
    if (!record) throw notFound('nghệ sĩ');
    const [topSongs, albums, allSongs, others] = await Promise.all([
      this.repos.songs.list({ artistId: id, sort: 'popular', limit: 10 }),
      this.repos.albums.list({ artistId: id, sort: 'newest', limit: 50 }),
      this.repos.songs.list({ artistId: id, limit: 1000 }),
      this.repos.artists.list({ sort: 'popular', limit: 50 }),
    ]);
    // Nghệ sĩ liên quan: ưu tiên cùng thể loại, sau đó là nghệ sĩ nổi bật khác.
    const related = others.items
      .filter((a) => a.id !== id)
      .sort((a, b) => sharedGenres(b.genreIds, record.genreIds) - sharedGenres(a.genreIds, record.genreIds))
      .slice(0, 6);
    const playlists = await this.repos.playlists.list({
      ownerId: null,
      publicOnly: true,
      containsAnySongIds: allSongs.items.map((s) => s.id),
      limit: 10,
    });
    const [[artist], topSongDtos, albumDtos, relatedDtos, playlistDtos] = await Promise.all([
      this.mapper.artists([record]),
      this.mapper.songs(topSongs.items),
      this.mapper.albums(albums.items),
      this.mapper.artists(related),
      this.mapper.playlists(playlists.items),
    ]);
    return { artist: artist!, topSongs: topSongDtos, albums: albumDtos, relatedArtists: relatedDtos, playlists: playlistDtos };
  }

  async listMoods(): Promise<Mood[]> {
    return this.mapper.moods(await this.repos.moods.list());
  }

  async getMoodDetail(id: string): Promise<MoodDetail> {
    const record = await this.repos.moods.findById(id);
    if (!record) throw notFound('tâm trạng');
    const [songs, albums] = await Promise.all([
      this.repos.songs.list({ moodId: id, sort: 'popular', limit: 100 }),
      this.repos.albums.list({ moodId: id, sort: 'newest', limit: 20 }),
    ]);
    const [[mood], songDtos, albumDtos] = await Promise.all([
      this.mapper.moods([record]),
      this.mapper.songs(songs.items),
      this.mapper.albums(albums.items),
    ]);
    return { mood: mood!, songs: songDtos, albums: albumDtos };
  }

  async listGenres(): Promise<Genre[]> {
    return this.mapper.genres(await this.repos.genres.list());
  }

  async getGenreDetail(id: string): Promise<GenreDetail> {
    const record = await this.repos.genres.findById(id);
    if (!record) throw notFound('thể loại');
    const [songs, albums, artists] = await Promise.all([
      this.repos.songs.list({ genreId: id, sort: 'popular', limit: 100 }),
      this.repos.albums.list({ genreId: id, sort: 'newest', limit: 20 }),
      this.repos.artists.list({ genreId: id, sort: 'popular', limit: 20 }),
    ]);
    const [[genre], songDtos, albumDtos, artistDtos] = await Promise.all([
      this.mapper.genres([record]),
      this.mapper.songs(songs.items),
      this.mapper.albums(albums.items),
      this.mapper.artists(artists.items),
    ]);
    return { genre: genre!, songs: songDtos, albums: albumDtos, artists: artistDtos };
  }
}

function sharedGenres(a: string[], b: string[]): number {
  return a.filter((g) => b.includes(g)).length;
}

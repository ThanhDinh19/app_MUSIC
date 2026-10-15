import type { SearchResults, SearchTopResult } from '@nocturne/shared';
import { matchScore } from '../../core/text';
import type { Repositories } from '../../data/repositories';
import type { AlbumRecord, PlaylistRecord, SongRecord, UserRecord } from '../../domain/entities';
import type { CatalogMapper } from '../catalog/catalog.mapper';

const EMPTY = (query: string): SearchResults => ({ query, topResult: null, songs: [], albums: [], artists: [], playlists: [], lyricsMatches: [] });

/**
 * Tìm kiếm bài hát, album, nghệ sĩ, playlist (không phân biệt dấu).
 * Lấy ứng viên qua repository (để SQL Server có thể tự tối ưu), sau đó chấm điểm & xếp hạng ở đây.
 */
export class SearchService {
  constructor(
    private readonly repos: Repositories,
    private readonly mapper: CatalogMapper,
  ) {}

  async search(rawQuery: string, limit: number, user?: UserRecord): Promise<SearchResults> {
    const query = rawQuery.trim();
    if (!query) return EMPTY(query);

    const artists = (await this.repos.artists.list({ search: query, limit: 20 })).items;
    const topArtistIds = artists.slice(0, 3).map((a) => a.id);

    const [lyricHits, songsByTitle, albumsByTitle, editorial, mine, ...byArtist] = await Promise.all([
      this.repos.lyrics.search(query, 10),
      this.repos.songs.list({ search: query, limit: 50 }),
      this.repos.albums.list({ search: query, limit: 20 }),
      this.repos.playlists.list({ ownerId: null, publicOnly: true, search: query, limit: 20 }),
      user ? this.repos.playlists.list({ ownerId: user.id, search: query, limit: 20 }) : Promise.resolve({ items: [], total: 0 }),
      ...topArtistIds.map((artistId) =>
        Promise.all([
          this.repos.songs.list({ artistId, sort: 'popular', limit: 10 }),
          this.repos.albums.list({ artistId, limit: 10 }),
        ]),
      ),
    ]);

    const artistScore = new Map(artists.map((a) => [a.id, matchScore(a.name, query)]));
    const scoreFromArtist = (artistId: string) => (artistScore.get(artistId) ?? 0) * 0.7;

    const songs = dedupe([...songsByTitle.items, ...byArtist.flatMap(([s]) => s.items)])
      .map((s): [SongRecord, number] => [s, Math.max(matchScore(s.title, query), scoreFromArtist(s.artistId)) + s.plays / 1e9])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    const albums = dedupe([...albumsByTitle.items, ...byArtist.flatMap(([, a]) => a.items)])
      .map((a): [AlbumRecord, number] => [a, Math.max(matchScore(a.title, query), scoreFromArtist(a.artistId))])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    const playlists = dedupe([...mine.items, ...editorial.items])
      .map((p): [PlaylistRecord, number] => [p, matchScore(p.name, query)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const [songDtos, albumDtos, artistDtos, playlistDtos, lyricSongs] = await Promise.all([
      this.mapper.songs(songs.map(([s]) => s)),
      this.mapper.albums(albums.map(([a]) => a)),
      this.mapper.artists(artists.slice(0, limit)),
      this.mapper.playlists(playlists.map(([p]) => p)),
      this.repos.songs.findByIds(lyricHits.map((h) => h.songId)).then((s) => this.mapper.songs(s)),
    ]);
    const lyricLineBySong = new Map(lyricHits.map((h) => [h.songId, h.line]));
    const lyricsMatches = lyricSongs.map((song) => ({ song, line: lyricLineBySong.get(song.id) ?? '' }));

    // Kết quả hàng đầu: điểm cao nhất; khi bằng điểm ưu tiên nghệ sĩ > album > bài hát > playlist.
    const candidates: [SearchTopResult, number][] = [];
    if (artistDtos[0]) candidates.push([{ type: 'artist', item: artistDtos[0] }, (artistScore.get(artistDtos[0].id) ?? 0) + 0.4]);
    if (albumDtos[0] && albums[0]) candidates.push([{ type: 'album', item: albumDtos[0] }, matchScore(albums[0][0].title, query) + 0.3]);
    if (songDtos[0] && songs[0]) candidates.push([{ type: 'song', item: songDtos[0] }, matchScore(songs[0][0].title, query) + 0.2]);
    if (playlistDtos[0] && playlists[0]) candidates.push([{ type: 'playlist', item: playlistDtos[0] }, playlists[0][1] + 0.1]);
    const topResult = candidates.sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return { query, topResult, songs: songDtos, albums: albumDtos, artists: artistDtos, playlists: playlistDtos, lyricsMatches };
  }
}

function dedupe<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

import type { DiscoverFeed, HomeFeed, Song } from '@nocturne/shared';
import { uniq } from '../../core/text';
import type { Repositories } from '../../data/repositories';
import type { UserRecord } from '../../domain/entities';
import type { CatalogMapper } from '../catalog/catalog.mapper';
import type { CatalogService } from '../catalog/catalog.service';

/** Tổng hợp dữ liệu cho trang chủ ("Nghe ngay") và trang Khám phá. */
export class HomeService {
  constructor(
    private readonly repos: Repositories,
    private readonly mapper: CatalogMapper,
    private readonly catalog: CatalogService,
  ) {}

  async getHome(user?: UserRecord): Promise<HomeFeed> {
    const [popular, newAlbums, moods, editorial, artists, recentlyPlayed] = await Promise.all([
      this.repos.songs.list({ sort: 'popular', limit: 200 }),
      this.repos.albums.list({ sort: 'newest', limit: 10 }),
      this.catalog.listMoods(),
      this.repos.playlists.list({ ownerId: null, publicOnly: true, limit: 12 }),
      this.repos.artists.list({ sort: 'popular', limit: 12 }),
      user ? this.recentlyPlayed(user.id, 12) : Promise.resolve([]),
    ]);

    // Album nổi bật = album có tổng lượt nghe cao nhất.
    const playsByAlbum = new Map<string, number>();
    for (const song of popular.items) playsByAlbum.set(song.albumId, (playsByAlbum.get(song.albumId) ?? 0) + song.plays);
    const featuredId = [...playsByAlbum.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    const [featured, trending, newReleases, editorialPlaylists, artistDtos] = await Promise.all([
      featuredId ? this.catalog.getAlbumDetail(featuredId) : Promise.resolve(null),
      this.mapper.songs(popular.items.slice(0, 10)),
      this.mapper.albums(newAlbums.items),
      this.mapper.playlists(editorial.items),
      this.mapper.artists(artists.items),
    ]);

    return { featured, trending, newReleases, moods, editorialPlaylists, artists: artistDtos, recentlyPlayed };
  }

  async getDiscover(): Promise<DiscoverFeed> {
    const [moods, genres, artists, fresh] = await Promise.all([
      this.catalog.listMoods(),
      this.catalog.listGenres(),
      this.repos.artists.list({ sort: 'popular', limit: 20 }),
      this.repos.songs.list({ sort: 'newest', limit: 12 }),
    ]);
    const [artistDtos, freshSongs] = await Promise.all([this.mapper.artists(artists.items), this.mapper.songs(fresh.items)]);
    return { moods, genres, artists: artistDtos, freshSongs };
  }

  /** Các bài nghe gần đây (không trùng lặp). */
  async recentlyPlayed(userId: string, limit: number): Promise<Song[]> {
    const history = await this.repos.history.list(userId, 100);
    const ids = uniq(history.map((h) => h.songId)).slice(0, limit);
    return this.mapper.songs(await this.repos.songs.findByIds(ids));
  }
}

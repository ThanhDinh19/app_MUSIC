import type { Album, Artist, LibraryIds, LibraryOverview, Song } from '@nocturne/shared';
import { notFound } from '../../core/http-error';
import type { Repositories } from '../../data/repositories';
import type { CatalogMapper } from '../catalog/catalog.mapper';
import type { HomeService } from '../home/home.service';
import type { PlaylistService } from '../playlists/playlists.service';

/** Thư viện cá nhân: bài hát yêu thích, album đã lưu, nghệ sĩ theo dõi. */
export class LibraryService {
  constructor(
    private readonly repos: Repositories,
    private readonly mapper: CatalogMapper,
    private readonly playlists: PlaylistService,
    private readonly home: HomeService,
  ) {}

  async getIds(userId: string): Promise<LibraryIds> {
    const [favorites, albums, artists] = await Promise.all([
      this.repos.library.listFavorites(userId),
      this.repos.library.listSavedAlbums(userId),
      this.repos.library.listFollowedArtists(userId),
    ]);
    return {
      favoriteSongIds: favorites.map((f) => f.songId),
      savedAlbumIds: albums.map((a) => a.albumId),
      followedArtistIds: artists.map((a) => a.artistId),
    };
  }

  async getOverview(userId: string): Promise<LibraryOverview> {
    const [favorites, playlists, savedAlbums, followedArtists, recentlyPlayed] = await Promise.all([
      this.listFavorites(userId),
      this.playlists.listByOwner(userId),
      this.listSavedAlbums(userId),
      this.listFollowedArtists(userId),
      this.home.recentlyPlayed(userId, 12),
    ]);
    return {
      favoritesCount: favorites.length,
      favoritePreviewCovers: [...new Set(favorites.map((s) => s.coverUrl))].slice(0, 4),
      recentlyPlayed,
      playlists,
      savedAlbums,
      followedArtists,
    };
  }

  async listFavorites(userId: string): Promise<Song[]> {
    const favorites = await this.repos.library.listFavorites(userId);
    return this.mapper.songs(await this.repos.songs.findByIds(favorites.map((f) => f.songId)));
  }

  async addFavorite(userId: string, songId: string): Promise<void> {
    if (!(await this.repos.songs.findById(songId))) throw notFound('bài hát');
    await this.repos.library.addFavorite(userId, songId);
  }

  async removeFavorite(userId: string, songId: string): Promise<void> {
    await this.repos.library.removeFavorite(userId, songId);
  }

  async listSavedAlbums(userId: string): Promise<Album[]> {
    const saved = await this.repos.library.listSavedAlbums(userId);
    return this.mapper.albums(await this.repos.albums.findByIds(saved.map((s) => s.albumId)));
  }

  async saveAlbum(userId: string, albumId: string): Promise<void> {
    if (!(await this.repos.albums.findById(albumId))) throw notFound('album');
    await this.repos.library.saveAlbum(userId, albumId);
  }

  async unsaveAlbum(userId: string, albumId: string): Promise<void> {
    await this.repos.library.unsaveAlbum(userId, albumId);
  }

  async listFollowedArtists(userId: string): Promise<Artist[]> {
    const followed = await this.repos.library.listFollowedArtists(userId);
    return this.mapper.artists(await this.repos.artists.findByIds(followed.map((f) => f.artistId)));
  }

  async followArtist(userId: string, artistId: string): Promise<void> {
    if (!(await this.repos.artists.findById(artistId))) throw notFound('nghệ sĩ');
    await this.repos.library.followArtist(userId, artistId);
  }

  async unfollowArtist(userId: string, artistId: string): Promise<void> {
    await this.repos.library.unfollowArtist(userId, artistId);
  }
}

import { normalizeText } from '../../core/text';
import type {
  FavoriteRecord,
  FollowedArtistRecord,
  PlayHistoryRecord,
  PlaylistRecord,
  SavedAlbumRecord,
  UserRecord,
} from '../../domain/entities';
import type {
  HistoryRepository,
  LibraryRepository,
  PageResult,
  PlaylistQuery,
  PlaylistRepository,
  UserRepository,
} from '../repositories';
import type { JsonCollection } from './json-collection';
import { byIdsInOrder, clone, paginate } from './paging';

const now = () => new Date().toISOString();
const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export class JsonUserRepository implements UserRepository {
  constructor(private readonly users: JsonCollection<UserRecord>) {}

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? clone(user) : null;
  }

  async findByIds(ids: readonly string[]): Promise<UserRecord[]> {
    return byIdsInOrder(this.users.all(), ids);
  }

  async create(user: UserRecord): Promise<UserRecord> {
    const existing = this.users.find((u) => u.id === user.id);
    if (existing) return clone(existing);
    return clone(this.users.insert(clone(user)));
  }

  async update(id: string, patch: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord | null> {
    const updated = this.users.update(
      (u) => u.id === id,
      (u) => ({ ...u, ...clone(patch) }),
    );
    return updated ? clone(updated) : null;
  }

  async delete(id: string): Promise<void> {
    this.users.remove((u) => u.id === id);
  }
}

export class JsonPlaylistRepository implements PlaylistRepository {
  constructor(private readonly playlists: JsonCollection<PlaylistRecord>) {}

  async list(query: PlaylistQuery): Promise<PageResult<PlaylistRecord>> {
    const search = query.search ? normalizeText(query.search) : '';
    const wanted = query.containsAnySongIds ? new Set(query.containsAnySongIds) : null;
    const items = this.playlists.filter(
      (p) =>
        (query.ownerId === undefined || p.ownerId === query.ownerId) &&
        (!query.publicOnly || p.isPublic) &&
        (!search || normalizeText(p.name).includes(search)) &&
        (!wanted || p.songIds.some((id) => wanted.has(id))),
    );
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return paginate(items.map(clone), query);
  }

  async findById(id: string): Promise<PlaylistRecord | null> {
    const playlist = this.playlists.find((p) => p.id === id);
    return playlist ? clone(playlist) : null;
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.playlists.filter((p) => p.ownerId === ownerId).length;
  }

  async reassignOwner(fromUserId: string, toUserId: string): Promise<void> {
    const ids = this.playlists.filter((p) => p.ownerId === fromUserId).map((p) => p.id);
    for (const id of ids) {
      this.playlists.update(
        (p) => p.id === id,
        (p) => ({ ...p, ownerId: toUserId }),
      );
    }
  }

  async create(playlist: PlaylistRecord): Promise<PlaylistRecord> {
    return clone(this.playlists.insert(clone(playlist)));
  }

  async update(id: string, patch: Partial<Omit<PlaylistRecord, 'id' | 'createdAt'>>): Promise<PlaylistRecord | null> {
    const updated = this.playlists.update(
      (p) => p.id === id,
      (p) => ({ ...p, ...clone(patch) }),
    );
    return updated ? clone(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.playlists.remove((p) => p.id === id) > 0;
  }
}

export class JsonLibraryRepository implements LibraryRepository {
  constructor(
    private readonly favorites: JsonCollection<FavoriteRecord>,
    private readonly savedAlbums: JsonCollection<SavedAlbumRecord>,
    private readonly followedArtists: JsonCollection<FollowedArtistRecord>,
  ) {}

  async listFavorites(userId: string): Promise<FavoriteRecord[]> {
    return this.favorites.filter((f) => f.userId === userId).sort(newestFirst).map(clone);
  }

  async addFavorite(userId: string, songId: string): Promise<void> {
    if (!this.favorites.find((f) => f.userId === userId && f.songId === songId)) {
      this.favorites.insert({ userId, songId, createdAt: now() });
    }
  }

  async removeFavorite(userId: string, songId: string): Promise<void> {
    this.favorites.remove((f) => f.userId === userId && f.songId === songId);
  }

  async listSavedAlbums(userId: string): Promise<SavedAlbumRecord[]> {
    return this.savedAlbums.filter((s) => s.userId === userId).sort(newestFirst).map(clone);
  }

  async saveAlbum(userId: string, albumId: string): Promise<void> {
    if (!this.savedAlbums.find((s) => s.userId === userId && s.albumId === albumId)) {
      this.savedAlbums.insert({ userId, albumId, createdAt: now() });
    }
  }

  async unsaveAlbum(userId: string, albumId: string): Promise<void> {
    this.savedAlbums.remove((s) => s.userId === userId && s.albumId === albumId);
  }

  async listFollowedArtists(userId: string): Promise<FollowedArtistRecord[]> {
    return this.followedArtists.filter((f) => f.userId === userId).sort(newestFirst).map(clone);
  }

  async followArtist(userId: string, artistId: string): Promise<void> {
    if (!this.followedArtists.find((f) => f.userId === userId && f.artistId === artistId)) {
      this.followedArtists.insert({ userId, artistId, createdAt: now() });
    }
  }

  async unfollowArtist(userId: string, artistId: string): Promise<void> {
    this.followedArtists.remove((f) => f.userId === userId && f.artistId === artistId);
  }

  async countFollowers(artistIds: readonly string[]): Promise<Map<string, number>> {
    const wanted = new Set(artistIds);
    const counts = new Map<string, number>(artistIds.map((id) => [id, 0]));
    for (const f of this.followedArtists.all()) {
      if (wanted.has(f.artistId)) counts.set(f.artistId, (counts.get(f.artistId) ?? 0) + 1);
    }
    return counts;
  }

  async mergeUser(fromUserId: string, toUserId: string): Promise<void> {
    const merge = <T extends { userId: string }>(collection: JsonCollection<T>, sameItem: (a: T, b: T) => boolean) => {
      const target = collection.filter((r) => r.userId === toUserId);
      const moving = collection.filter((r) => r.userId === fromUserId);
      collection.remove((r) => r.userId === fromUserId);
      for (const record of moving) {
        if (!target.some((t) => sameItem(t, record))) collection.insert({ ...record, userId: toUserId });
      }
    };
    merge(this.favorites, (a, b) => a.songId === b.songId);
    merge(this.savedAlbums, (a, b) => a.albumId === b.albumId);
    merge(this.followedArtists, (a, b) => a.artistId === b.artistId);
  }
}

export class JsonHistoryRepository implements HistoryRepository {
  constructor(private readonly history: JsonCollection<PlayHistoryRecord>) {}

  async list(userId: string, limit: number): Promise<PlayHistoryRecord[]> {
    return this.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
      .slice(0, limit)
      .map(clone);
  }

  async add(entry: PlayHistoryRecord, maxPerUser: number): Promise<void> {
    this.history.insert(clone(entry));
    const mine = this.history.filter((h) => h.userId === entry.userId);
    if (mine.length > maxPerUser) {
      const keep = new Set(
        mine
          .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
          .slice(0, maxPerUser)
          .map((h) => h.id),
      );
      this.history.remove((h) => h.userId === entry.userId && !keep.has(h.id));
    }
  }

  async clear(userId: string): Promise<void> {
    this.history.remove((h) => h.userId === userId);
  }

  async reassignUser(fromUserId: string, toUserId: string): Promise<void> {
    const moving = this.history.filter((h) => h.userId === fromUserId);
    this.history.remove((h) => h.userId === fromUserId);
    for (const entry of moving) this.history.insert({ ...entry, userId: toUserId });
  }
}

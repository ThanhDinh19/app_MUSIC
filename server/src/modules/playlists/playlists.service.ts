import { randomUUID } from 'node:crypto';
import type {
  CreatePlaylistInput,
  Playlist,
  PlaylistDetail,
  UpdatePlaylistInput,
} from '@nocturne/shared';
import { badRequest, conflict, forbidden, notFound } from '../../core/http-error';
import type { Repositories } from '../../data/repositories';
import type { PlaylistRecord } from '../../domain/entities';
import { type CatalogMapper, moodBreakdown } from '../catalog/catalog.mapper';

const MAX_PLAYLISTS_PER_USER = 100;
const MAX_SONGS_PER_PLAYLIST = 500;

/** Playlist biên tập (chỉ đọc) và playlist cá nhân (tạo/sửa/xoá/sắp xếp). */
export class PlaylistService {
  constructor(
    private readonly repos: Repositories,
    private readonly mapper: CatalogMapper,
  ) {}

  async listEditorial(): Promise<Playlist[]> {
    const { items } = await this.repos.playlists.list({ ownerId: null, publicOnly: true, limit: 50 });
    return this.mapper.playlists(items);
  }

  async listByOwner(userId: string): Promise<Playlist[]> {
    const { items } = await this.repos.playlists.list({ ownerId: userId, limit: MAX_PLAYLISTS_PER_USER });
    return this.mapper.playlists(items);
  }

  async getDetail(id: string, userId?: string): Promise<PlaylistDetail> {
    const record = await this.repos.playlists.findById(id);
    if (!record || (!record.isPublic && record.ownerId !== userId)) throw notFound('playlist');
    const [[playlist], songs] = await Promise.all([
      this.mapper.playlists([record]),
      this.repos.songs.findByIds(record.songIds).then((s) => this.mapper.songs(s)),
    ]);
    return { playlist: playlist!, songs, moodBreakdown: moodBreakdown(songs) };
  }

  async create(userId: string, input: CreatePlaylistInput): Promise<Playlist> {
    if ((await this.repos.playlists.countByOwner(userId)) >= MAX_PLAYLISTS_PER_USER) {
      throw conflict(`Bạn chỉ có thể tạo tối đa ${MAX_PLAYLISTS_PER_USER} playlist.`);
    }
    if (input.songId) await this.assertSongExists(input.songId);
    const now = new Date().toISOString();
    const record = await this.repos.playlists.create({
      id: randomUUID(),
      ownerId: userId,
      name: input.name,
      description: input.description ?? '',
      coverPath: null,
      songIds: input.songId ? [input.songId] : [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });
    return this.toDto(record);
  }

  async update(userId: string, id: string, input: UpdatePlaylistInput): Promise<Playlist> {
    await this.getOwned(userId, id);
    const updated = await this.repos.playlists.update(id, { ...input, updatedAt: new Date().toISOString() });
    return this.toDto(updated!);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await this.repos.playlists.delete(id);
  }

  async addSong(userId: string, id: string, songId: string): Promise<Playlist> {
    const playlist = await this.getOwned(userId, id);
    await this.assertSongExists(songId);
    if (playlist.songIds.includes(songId)) throw conflict('Bài hát đã có trong playlist này.');
    if (playlist.songIds.length >= MAX_SONGS_PER_PLAYLIST) throw conflict('Playlist đã đạt số bài tối đa.');
    const updated = await this.repos.playlists.update(id, {
      songIds: [...playlist.songIds, songId],
      updatedAt: new Date().toISOString(),
    });
    return this.toDto(updated!);
  }

  async removeSong(userId: string, id: string, songId: string): Promise<Playlist> {
    const playlist = await this.getOwned(userId, id);
    const updated = await this.repos.playlists.update(id, {
      songIds: playlist.songIds.filter((s) => s !== songId),
      updatedAt: new Date().toISOString(),
    });
    return this.toDto(updated!);
  }

  /** Sắp xếp lại: `songIds` phải là hoán vị của danh sách hiện tại. */
  async reorder(userId: string, id: string, songIds: string[]): Promise<Playlist> {
    const playlist = await this.getOwned(userId, id);
    const current = [...playlist.songIds].sort();
    const next = [...songIds].sort();
    if (current.length !== next.length || current.some((s, i) => s !== next[i])) {
      throw badRequest('Danh sách sắp xếp phải gồm đúng các bài hát hiện có trong playlist.');
    }
    const updated = await this.repos.playlists.update(id, { songIds, updatedAt: new Date().toISOString() });
    return this.toDto(updated!);
  }

  private async getOwned(userId: string, id: string): Promise<PlaylistRecord> {
    const playlist = await this.repos.playlists.findById(id);
    if (!playlist) throw notFound('playlist');
    if (playlist.ownerId !== userId) throw forbidden('Bạn chỉ có thể chỉnh sửa playlist của chính mình.');
    return playlist;
  }

  private async assertSongExists(songId: string): Promise<void> {
    if (!(await this.repos.songs.findById(songId))) throw notFound('bài hát');
  }

  private async toDto(record: PlaylistRecord): Promise<Playlist> {
    const [dto] = await this.mapper.playlists([record]);
    return dto!;
  }
}

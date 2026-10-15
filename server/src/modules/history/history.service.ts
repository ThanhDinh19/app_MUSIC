import { randomUUID } from 'node:crypto';
import type { HistoryEntry } from '@nocturne/shared';
import { notFound } from '../../core/http-error';
import type { Repositories } from '../../data/repositories';
import type { CatalogMapper } from '../catalog/catalog.mapper';

const MAX_HISTORY_PER_USER = 300;
/** Bỏ qua lượt nghe lặp lại cùng một bài trong khoảng thời gian ngắn (vd. tua đi tua lại). */
const DUPLICATE_WINDOW_MS = 30_000;

export class HistoryService {
  constructor(
    private readonly repos: Repositories,
    private readonly mapper: CatalogMapper,
  ) {}

  async list(userId: string, limit: number): Promise<HistoryEntry[]> {
    const entries = await this.repos.history.list(userId, limit);
    const songs = await this.mapper.songs(await this.repos.songs.findByIds([...new Set(entries.map((e) => e.songId))]));
    const songById = new Map(songs.map((s) => [s.id, s]));
    return entries
      .filter((e) => songById.has(e.songId))
      .map((e) => ({ id: e.id, playedAt: e.playedAt, song: songById.get(e.songId)! }));
  }

  /** Ghi nhận một lượt nghe: lưu lịch sử + tăng lượt nghe của bài hát. */
  async record(userId: string, songId: string): Promise<void> {
    if (!(await this.repos.songs.findById(songId))) throw notFound('bài hát');
    const [last] = await this.repos.history.list(userId, 1);
    if (last && last.songId === songId && Date.now() - Date.parse(last.playedAt) < DUPLICATE_WINDOW_MS) return;
    await Promise.all([
      this.repos.history.add({ id: randomUUID(), userId, songId, playedAt: new Date().toISOString() }, MAX_HISTORY_PER_USER),
      this.repos.songs.incrementPlays(songId),
    ]);
  }

  async clear(userId: string): Promise<void> {
    await this.repos.history.clear(userId);
  }
}

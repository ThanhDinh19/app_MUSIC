import { readFile, rename, writeFile, unlink } from 'node:fs/promises';

/**
 * Một "bảng" lưu trong file JSON (mảng các bản ghi).
 *  - Dữ liệu được nạp vào bộ nhớ khi khởi động → đọc rất nhanh.
 *  - Mỗi thay đổi đánh dấu "dirty" và được ghi xuống đĩa sau một khoảng ngắn (gộp nhiều thay đổi).
 *  - Ghi kiểu atomic: ghi ra file tạm rồi đổi tên → không bị hỏng file khi tắt đột ngột.
 *
 * Chỉ dùng trong src/data/json — phần còn lại của ứng dụng không biết tới class này.
 */
export class JsonCollection<T extends object> {
  private items: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private writing: Promise<void> = Promise.resolve();

  constructor(
    readonly name: string,
    private readonly file: string,
    private readonly flushDelayMs = 120,
  ) {}

  async load(): Promise<void> {
    const raw = await readFile(this.file, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error(`File ${this.file} phải chứa một mảng JSON.`);
    this.items = parsed as T[];
  }

  all(): readonly T[] {
    return this.items;
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  insert(item: T): T {
    this.items.push(item);
    this.markDirty();
    return item;
  }

  /** Cập nhật bản ghi đầu tiên khớp điều kiện. Trả về bản ghi mới hoặc undefined. */
  update(predicate: (item: T) => boolean, updater: (item: T) => T): T | undefined {
    const index = this.items.findIndex(predicate);
    if (index < 0) return undefined;
    const next = updater(this.items[index]!);
    this.items[index] = next;
    this.markDirty();
    return next;
  }

  /** Xoá mọi bản ghi khớp điều kiện. Trả về số bản ghi đã xoá. */
  remove(predicate: (item: T) => boolean): number {
    const before = this.items.length;
    this.items = this.items.filter((item) => !predicate(item));
    const removed = before - this.items.length;
    if (removed > 0) this.markDirty();
    return removed;
  }

  replaceAll(items: T[]): void {
    this.items = items;
    this.markDirty();
  }

  private markDirty(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.flushDelayMs);
  }

  /** Ghi ngay xuống đĩa (các lần ghi được xếp hàng tuần tự). */
  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const snapshot = JSON.stringify(this.items, null, 2) + '\n';
    this.writing = this.writing.then(() => this.writeAtomic(snapshot)).catch((error) => {
      console.error(`[json] Không ghi được ${this.name}:`, error);
    });
    return this.writing;
  }

  private async writeAtomic(content: string): Promise<void> {
    const tmp = `${this.file}.${process.pid}.tmp`;
    await writeFile(tmp, content, 'utf8');
    try {
      await rename(tmp, this.file);
    } catch {
      // Windows đôi khi khoá file (antivirus/indexer) → ghi trực tiếp.
      await writeFile(this.file, content, 'utf8');
      await unlink(tmp).catch(() => undefined);
    }
  }
}

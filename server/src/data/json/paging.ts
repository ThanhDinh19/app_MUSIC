import type { PageQuery, PageResult } from '../repositories';

export const DEFAULT_LIMIT = 50;

export function paginate<T>(items: T[], query: PageQuery): PageResult<T> {
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.max(1, query.limit ?? DEFAULT_LIMIT);
  return { items: items.slice(offset, offset + limit), total: items.length };
}

/** Sao chép sâu để service không vô tình sửa trực tiếp dữ liệu trong bộ nhớ. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function byIdsInOrder<T extends { id: string }>(items: readonly T[], ids: readonly string[]): T[] {
  const map = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter((item): item is T => item !== undefined).map(clone);
}

import type { LyricLine } from '@nocturne/shared';

/** Vị trí dòng đang hát: dòng cuối cùng có `time <= t` (tìm nhị phân). -1 nếu chưa tới dòng đầu. */
export function activeLineIndex(lines: readonly LyricLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid]!.time <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

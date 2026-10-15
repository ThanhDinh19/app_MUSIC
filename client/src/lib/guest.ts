import { storage } from './storage';

const KEY = 'nocturne:guest-id';

/** crypto.randomUUID chỉ có trong "secure context" (HTTPS/localhost) — mở qua IP LAN cần phương án dự phòng. */
function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

let cached: string | null = null;

/**
 * Mã khách: định danh thiết bị khi chưa có đăng nhập (giai đoạn 1–2).
 * Server lưu playlist, bài yêu thích, lịch sử theo mã này.
 */
export function getGuestId(): string {
  if (cached) return cached;
  let id = storage.get<string | null>(KEY, null);
  if (!id) {
    id = uuid();
    storage.set(KEY, id);
  }
  cached = id;
  return id;
}

/** Tạo mã khách mới (bắt đầu lại với thư viện trống). */
export function resetGuestId(): string {
  cached = uuid();
  storage.set(KEY, cached);
  return cached;
}

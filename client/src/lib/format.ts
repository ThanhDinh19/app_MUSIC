/** 205 → "3:25" */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** 1560 → "26 phút", 3900 → "1 giờ 5 phút" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('vi-VN');

/** 1284000 → "1,3 Tr" */
export function formatCompact(n: number): string {
  return compact.format(n);
}

export function formatNumber(n: number): string {
  return full.format(n);
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'Chào buổi sáng';
  if (h >= 11 && h < 14) return 'Chào buổi trưa';
  if (h >= 14 && h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const dayFormat = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  const label = dayFormat.format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function clockTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

export const ALBUM_TYPE_LABEL = { album: 'Album', ep: 'EP', single: 'Đĩa đơn' } as const;

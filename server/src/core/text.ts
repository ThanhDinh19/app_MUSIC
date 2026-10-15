/** Chuẩn hoá chuỗi để tìm kiếm: bỏ dấu tiếng Việt, chữ thường, gọn khoảng trắng. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Điểm khớp đơn giản: khớp hoàn toàn > bắt đầu bằng > bắt đầu một từ > chứa. 0 = không khớp. */
export function matchScore(text: string, query: string): number {
  const t = normalizeText(text);
  const q = normalizeText(query);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.split(' ').some((word) => word.startsWith(q))) return 60;
  if (t.includes(q)) return 40;
  return 0;
}

export function initialsOf(name: string): string {
  // Chỉ lấy các từ bắt đầu bằng chữ cái ("Người nghe 678" → "NN").
  const words = name.trim().split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (words.length === 0) return '?';
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : '';
  return (first + last).toUpperCase();
}

export function uniq<T>(items: Iterable<T>): T[] {
  return [...new Set(items)];
}

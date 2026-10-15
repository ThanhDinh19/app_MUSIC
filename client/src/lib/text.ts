/** Bỏ dấu một ký tự tiếng Việt (giữ nguyên độ dài chuỗi để ánh xạ vị trí). */
function foldChar(c: string): string {
  const base = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (base === 'đ') return 'd';
  if (base === 'Đ') return 'D';
  return (base[0] ?? c).toLowerCase();
}

/**
 * Tìm vị trí từ khoá trong chuỗi, không phân biệt hoa thường và dấu tiếng Việt.
 * Trả về [start, end) theo chuỗi gốc — dùng để tô đậm đoạn khớp.
 */
export function findFolded(text: string, query: string): [number, number] | null {
  const chars = Array.from(text.normalize('NFC'));
  const folded = chars.map(foldChar).join('');
  const q = Array.from(query.normalize('NFC').trim()).map(foldChar).join('');
  if (!q) return null;
  const index = folded.indexOf(q);
  if (index < 0) return null;
  // `chars` đã tách theo code point và mỗi ký tự gập lại thành đúng 1 ký tự → vị trí trùng khớp.
  const start = chars.slice(0, index).join('').length;
  const end = start + chars.slice(index, index + q.length).join('').length;
  return [start, end];
}

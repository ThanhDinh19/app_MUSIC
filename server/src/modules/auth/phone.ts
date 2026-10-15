/**
 * Chuẩn hoá số di động Việt Nam về dạng `84xxxxxxxxx` (định dạng Zalo ZNS yêu cầu).
 * Chấp nhận: "0912 345 678", "+84 912 345 678", "84912345678", "912345678". Trả về null nếu không hợp lệ.
 */
export function normalizeVnPhone(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('0')) digits = `84${digits.slice(1)}`;
  else if (digits.length === 9) digits = `84${digits}`;
  return /^84[35789]\d{8}$/.test(digits) ? digits : null;
}

/** 84912345678 → "091****678" */
export function maskPhone(normalized: string): string {
  const local = `0${normalized.slice(2)}`;
  return `${local.slice(0, 3)}****${local.slice(-3)}`;
}

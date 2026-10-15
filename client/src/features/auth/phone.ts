/** Kiểm tra nhanh số di động Việt Nam phía client (server kiểm tra lại). */
export function isValidVnPhone(input: string): boolean {
  let digits = input.replace(/[\s.\-()]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return false;
  if (digits.startsWith('0')) digits = `84${digits.slice(1)}`;
  else if (digits.length === 9) digits = `84${digits}`;
  return /^84[35789]\d{8}$/.test(digits);
}

/** "0912345678" → "0912 345 678" khi đang gõ. */
export function formatPhoneInput(input: string): string {
  const digits = input.replace(/[^\d+]/g, '').slice(0, 13);
  if (digits.startsWith('+') || digits.length <= 4) return digits;
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10), digits.slice(10)].filter(Boolean).join(' ');
}

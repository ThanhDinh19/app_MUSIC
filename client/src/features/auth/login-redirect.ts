import { storage } from '../../lib/storage';

const FROM_KEY = 'nocturne:login-from';

/** Ghi nhớ trang cần quay lại sau khi đăng nhập (kể cả khi Google chuyển trang). */
export function rememberLoginRedirect(path: string): void {
  storage.set(FROM_KEY, path);
}

export function consumeLoginRedirect(): string {
  const from = storage.get<string>(FROM_KEY, '/profile');
  storage.remove(FROM_KEY);
  // Chỉ chấp nhận đường dẫn nội bộ.
  return from.startsWith('/') && !from.startsWith('//') ? from : '/profile';
}

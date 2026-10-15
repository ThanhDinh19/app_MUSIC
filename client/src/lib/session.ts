import { storage } from './storage';

const KEY = 'nocturne:session';
const listeners = new Set<(reason: 'login' | 'logout' | 'expired') => void>();

/** Mã phiên đăng nhập (gửi kèm mỗi request qua header Authorization). */
export function getSessionToken(): string | null {
  return storage.get<string | null>(KEY, null);
}

export function setSessionToken(token: string): void {
  storage.set(KEY, token);
  listeners.forEach((l) => l('login'));
}

export function clearSessionToken(reason: 'logout' | 'expired'): void {
  storage.remove(KEY);
  listeners.forEach((l) => l(reason));
}

/** Theo dõi thay đổi phiên (đăng nhập, đăng xuất, hết hạn). */
export function onSessionChange(listener: (reason: 'login' | 'logout' | 'expired') => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

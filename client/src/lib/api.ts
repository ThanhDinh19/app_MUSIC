import type { ApiErrorBody } from '@nocturne/shared';
import { getGuestId } from './guest';
import { clearSessionToken, getSessionToken } from './session';

const GUEST_HEADER = 'x-guest-id';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, { query, body, signal }: RequestOptions = {}, retried = false): Promise<T> {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  // Đã đăng nhập → gửi mã phiên; chưa đăng nhập → gửi mã khách.
  const token = getSessionToken();
  const identity: Record<string, string> = token ? { authorization: `Bearer ${token}` } : { [GUEST_HEADER]: getGuestId() };

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: {
        ...identity,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    // Phiên hết hạn → đăng xuất cục bộ và thử lại một lần ở chế độ khách.
    if (res.status === 401 && err?.code === 'SESSION_EXPIRED' && token && !retried) {
      clearSessionToken('expired');
      return request<T>(method, path, { query, body, signal }, true);
    }
    throw new ApiError(res.status, err?.code ?? 'HTTP_ERROR', err?.message ?? `Lỗi máy chủ (${res.status}).`, err?.details);
  }
  return data as T;
}

/** HTTP client duy nhất của ứng dụng — tự gắn danh tính (phiên đăng nhập hoặc mã khách) và chuẩn hoá lỗi. */
export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

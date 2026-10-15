/** Lỗi có mã HTTP — được error handler chuyển thành JSON `{ error: { code, message, details } }`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, 'BAD_REQUEST', message, details);
export const unauthorized = (message = 'Bạn cần đăng nhập hoặc gửi mã khách (x-guest-id).') =>
  new HttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Bạn không có quyền thực hiện thao tác này.') => new HttpError(403, 'FORBIDDEN', message);
export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `Không tìm thấy ${what}.`);
export const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);
export const tooManyRequests = (message: string, retryAfterSec: number) =>
  new HttpError(429, 'TOO_MANY_REQUESTS', message, { retryAfterSec });

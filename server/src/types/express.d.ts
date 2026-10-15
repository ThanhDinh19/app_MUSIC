import type { UserRecord } from '../domain/entities';

declare global {
  namespace Express {
    interface Request {
      /** Người dùng hiện tại (khách hoặc thành viên) — gán bởi middleware currentUser. */
      user?: UserRecord;
      /** Mã phiên đăng nhập (chỉ có khi đăng nhập bằng Bearer token). */
      sessionId?: string;
    }
  }
}

export {};

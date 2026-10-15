import type { RequestHandler } from 'express';
import { HttpError, unauthorized } from '../../core/http-error';
import type { AuthService } from '../auth/auth.service';
import type { UserService } from './users.service';

export const GUEST_HEADER = 'x-guest-id';
export const GUEST_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

/**
 * Xác định người dùng hiện tại:
 *  1. `Authorization: Bearer <token>` → thành viên đã đăng nhập (token sai/hết hạn → 401 SESSION_EXPIRED).
 *  2. Không có token → khách theo header `x-guest-id` (không bắt buộc).
 */
export function currentUser(users: UserService, auth: AuthService): RequestHandler {
  return async (req, _res, next) => {
    const authorization = req.header('authorization');
    if (authorization?.startsWith('Bearer ')) {
      const resolved = await auth.resolveSession(authorization.slice('Bearer '.length).trim());
      if (!resolved) throw new HttpError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      req.user = resolved.user;
      req.sessionId = resolved.session.id;
      return next();
    }

    const guestId = req.header(GUEST_HEADER);
    if (guestId && GUEST_ID_PATTERN.test(guestId)) {
      req.user = (await users.ensureGuest(guestId)) ?? undefined;
    }
    next();
  };
}

export const requireUser: RequestHandler = (req, _res, next) => {
  next(req.user ? undefined : unauthorized());
};

import express, { type Request, Router } from 'express';
import { z } from 'zod';
import { HttpError, tooManyRequests } from '../../core/http-error';
import { RateLimiter } from '../../core/rate-limit';
import { parse } from '../../core/validate';
import type { Services } from '../services';
import { GUEST_ID_PATTERN } from '../users/current-user.middleware';

const sendOtpBody = z.object({
  phone: z.string().trim().min(6, 'Số điện thoại không hợp lệ. Ví dụ: 0912 345 678.').max(20, 'Số điện thoại không hợp lệ.'),
});
const verifyOtpBody = z.object({
  challengeId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, 'Mã xác nhận gồm 6 chữ số'),
});
const googleBody = z.object({ credential: z.string().min(20).max(4096) });

const meta = (req: Request) => ({ userAgent: req.header('user-agent') ?? '' });

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of header?.split(';') ?? []) {
    const index = part.indexOf('=');
    if (index > 0) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

/** /api/auth — đăng nhập bằng Google và bằng số điện thoại Zalo (OTP). */
export function authRoutes({ auth, otp, google, users }: Services): Router {
  const router = Router();
  const googleLimiter = new RateLimiter(30, 10 * 60_000);
  const verifyLimiter = new RateLimiter(30, 10 * 60_000);

  router.get('/config', (_req, res) => {
    res.json(auth.getConfig());
  });

  /** Bước 1 (Zalo): gửi mã 6 số tới số điện thoại qua Zalo. */
  router.post('/otp/send', async (req, res) => {
    const { phone } = parse(sendOtpBody, req.body);
    res.json(await otp.send(phone, req.ip ?? 'unknown'));
  });

  /** Bước 2 (Zalo): nhập mã → đăng nhập. */
  router.post('/otp/verify', async (req, res) => {
    const wait = verifyLimiter.take(req.ip ?? 'unknown');
    if (wait > 0) throw tooManyRequests('Bạn thử quá nhiều lần. Vui lòng đợi một lát.', wait);
    const { challengeId, code } = parse(verifyOtpBody, req.body);
    const phone = await otp.verify(challengeId, code);
    res.json(await auth.login({ provider: 'zalo', providerUserId: phone }, req.user, meta(req)));
  });

  /** Google (chế độ popup): client gửi ID token nhận được từ nút "Sign in with Google". */
  router.post('/google', async (req, res) => {
    const wait = googleLimiter.take(req.ip ?? 'unknown');
    if (wait > 0) throw tooManyRequests('Bạn thử quá nhiều lần. Vui lòng đợi một lát.', wait);
    const { credential } = parse(googleBody, req.body);
    const profile = await google.verify(credential);
    res.json(
      await auth.login(
        { provider: 'google', providerUserId: profile.sub, email: profile.email, displayName: profile.name, avatarUrl: profile.picture },
        req.user,
        meta(req),
      ),
    );
  });

  /**
   * Google (chế độ chuyển trang): dùng khi app chạy ở dạng PWA đã cài — nơi cửa sổ popup không hoạt động.
   * Google POST form về đây; xác minh xong thì chuyển về /login/callback kèm mã phiên trong phần # của URL.
   */
  router.post('/google/redirect', express.urlencoded({ extended: false, limit: '16kb' }), async (req, res) => {
    const fail = (reason: string) => res.redirect(303, `/login/callback#error=${encodeURIComponent(reason)}`);
    const cookies = parseCookies(req.headers.cookie);
    const body = (req.body ?? {}) as Record<string, string | undefined>;
    // Chống CSRF theo hướng dẫn của Google: cookie g_csrf_token phải khớp giá trị trong form.
    if (!body.g_csrf_token || body.g_csrf_token !== cookies.g_csrf_token) return fail('csrf');
    if (!body.credential) return fail('google');

    try {
      const profile = await google.verify(body.credential);
      const guestId = cookies.nocturne_guest;
      const guest = guestId && GUEST_ID_PATTERN.test(guestId) ? ((await users.ensureGuest(guestId)) ?? undefined) : undefined;
      const result = await auth.login(
        { provider: 'google', providerUserId: profile.sub, email: profile.email, displayName: profile.name, avatarUrl: profile.picture },
        guest,
        meta(req),
      );
      res.setHeader('Set-Cookie', 'nocturne_guest=; Path=/; Max-Age=0; SameSite=Lax');
      res.redirect(
        303,
        `/login/callback#session=${encodeURIComponent(result.token)}&merged=${result.mergedGuestData ? 1 : 0}&new=${result.isNewUser ? 1 : 0}`,
      );
    } catch (error) {
      console.error('[google] Đăng nhập (redirect) thất bại:', error instanceof HttpError ? error.message : error);
      fail('google');
    }
  });

  router.post('/logout', async (req, res) => {
    if (req.sessionId) await auth.logout(req.sessionId);
    res.status(204).end();
  });

  return router;
}

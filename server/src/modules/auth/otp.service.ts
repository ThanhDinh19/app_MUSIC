import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { SendOtpResult } from '@nocturne/shared';
import { badRequest, HttpError, tooManyRequests } from '../../core/http-error';
import { RateLimiter } from '../../core/rate-limit';
import type { Repositories } from '../../data/repositories';
import type { OtpSender } from './otp-senders';
import { maskPhone, normalizeVnPhone } from './phone';

const CODE_TTL_MS = 5 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS_PER_PHONE_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const HOUR_MS = 60 * 60_000;

/**
 * Mã xác nhận một lần (OTP) gửi tới số điện thoại.
 *  - Mã 6 chữ số, hiệu lực 5 phút, chỉ dùng được một lần.
 *  - Chỉ lưu HMAC của mã (không lưu mã gốc).
 *  - Chống lạm dụng: chờ 60 giây giữa hai lần gửi, tối đa 5 lần/giờ/số, 20 lần/giờ/IP, nhập sai 5 lần thì khoá mã.
 */
export class OtpService {
  private readonly ipLimiter = new RateLimiter(20, HOUR_MS);

  constructor(
    private readonly repos: Repositories,
    private readonly sender: OtpSender | null,
    private readonly secret: string,
    /** Trả mã về cho client — chỉ bật ở môi trường phát triển với kênh console. */
    private readonly exposeDevCode: boolean,
  ) {}

  get enabled(): boolean {
    return this.sender !== null;
  }

  get mode(): 'console' | 'zalo' {
    return this.sender?.mode ?? 'console';
  }

  async send(rawPhone: string, ip: string): Promise<SendOtpResult> {
    if (!this.sender) throw new HttpError(503, 'OTP_DISABLED', 'Đăng nhập bằng Zalo đang tạm tắt.');
    const phone = normalizeVnPhone(rawPhone);
    if (!phone) throw badRequest('Số điện thoại không hợp lệ. Ví dụ: 0912 345 678.');

    const now = Date.now();
    const recent = await this.repos.otpChallenges.listByPhoneSince(phone, new Date(now - HOUR_MS).toISOString());
    const last = recent[0];
    if (last && now - Date.parse(last.createdAt) < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((Date.parse(last.createdAt) + RESEND_COOLDOWN_MS - now) / 1000);
      throw tooManyRequests(`Vui lòng chờ ${wait} giây trước khi gửi lại mã.`, wait);
    }
    if (recent.length >= MAX_SENDS_PER_PHONE_PER_HOUR) {
      const oldest = recent[recent.length - 1]!;
      const wait = Math.ceil((Date.parse(oldest.createdAt) + HOUR_MS - now) / 1000);
      throw tooManyRequests('Bạn đã yêu cầu quá nhiều mã cho số này. Vui lòng thử lại sau.', wait);
    }
    const ipWait = this.ipLimiter.take(ip);
    if (ipWait > 0) throw tooManyRequests('Có quá nhiều yêu cầu gửi mã từ mạng của bạn. Vui lòng thử lại sau.', ipWait);

    const id = randomUUID();
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.sender.send(phone, code, CODE_TTL_MS / 60_000);
    await this.repos.otpChallenges.create({
      id,
      phone,
      codeHash: this.hash(id, code),
      attempts: 0,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
      consumedAt: null,
    });
    void this.repos.otpChallenges.deleteOlderThan(new Date(now - 24 * HOUR_MS).toISOString());

    return {
      challengeId: id,
      phoneMasked: maskPhone(phone),
      expiresInSec: CODE_TTL_MS / 1000,
      resendInSec: RESEND_COOLDOWN_MS / 1000,
      ...(this.exposeDevCode && this.sender.mode === 'console' ? { devCode: code } : {}),
    };
  }

  /** Kiểm tra mã. Thành công → trả về số điện thoại đã xác thực (dạng 84xxxxxxxxx). */
  async verify(challengeId: string, code: string): Promise<string> {
    const challenge = await this.repos.otpChallenges.findById(challengeId);
    if (!challenge || challenge.consumedAt) {
      throw new HttpError(400, 'OTP_EXPIRED', 'Mã xác nhận không còn hiệu lực. Vui lòng gửi lại mã.');
    }
    if (Date.parse(challenge.expiresAt) < Date.now()) {
      throw new HttpError(400, 'OTP_EXPIRED', 'Mã xác nhận đã hết hạn. Vui lòng gửi lại mã.');
    }
    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpError(400, 'OTP_LOCKED', 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.');
    }

    const expected = Buffer.from(challenge.codeHash, 'hex');
    const actual = Buffer.from(this.hash(challenge.id, code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      const attempts = challenge.attempts + 1;
      await this.repos.otpChallenges.update(challenge.id, { attempts });
      const left = MAX_VERIFY_ATTEMPTS - attempts;
      throw new HttpError(
        400,
        left > 0 ? 'OTP_INVALID' : 'OTP_LOCKED',
        left > 0 ? `Mã không đúng. Bạn còn ${left} lần thử.` : 'Mã không đúng. Vui lòng gửi lại mã mới.',
        { attemptsLeft: left },
      );
    }

    await this.repos.otpChallenges.update(challenge.id, { consumedAt: new Date().toISOString() });
    return challenge.phone;
  }

  private hash(challengeId: string, code: string): string {
    return createHmac('sha256', this.secret).update(`${challengeId}:${code}`).digest('hex');
  }
}

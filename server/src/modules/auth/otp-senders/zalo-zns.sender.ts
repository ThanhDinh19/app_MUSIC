import { randomUUID } from 'node:crypto';
import { HttpError } from '../../../core/http-error';
import type { OtpSender } from './otp-sender';
import type { ZaloTokenStore } from './zalo-token.store';

export interface ZaloZnsConfig {
  znsBase: string;
  templateId: string;
  /** Tên tham số chứa mã trong mẫu ZNS đã đăng ký (thường là `otp`). */
  otpParam: string;
  /** `development`: chỉ gửi được tới số quản trị viên của OA (miễn phí, để thử). */
  mode: 'production' | 'development';
}

interface ZnsResponse {
  error: number;
  message?: string;
}

/** Một số mã lỗi ZNS thường gặp → thông báo dễ hiểu. Các mã khác hiển thị kèm số lỗi. */
const KNOWN_ERRORS: Record<number, { status: number; message: string }> = {
  [-108]: { status: 400, message: 'Số điện thoại không hợp lệ.' },
  [-118]: { status: 400, message: 'Số điện thoại này chưa đăng ký Zalo hoặc tài khoản Zalo không hoạt động.' },
  [-124]: { status: 503, message: 'Kết nối Zalo đã hết hạn. Vui lòng thử lại sau.' },
};

/** Gửi mã OTP qua Zalo Notification Service bằng mẫu tin (template) đã được Zalo duyệt. */
export class ZaloZnsOtpSender implements OtpSender {
  readonly mode = 'zalo' as const;

  constructor(
    private readonly config: ZaloZnsConfig,
    private readonly tokens: ZaloTokenStore,
  ) {}

  async send(phone: string, code: string): Promise<void> {
    let result = await this.post(phone, code, await this.tokens.getAccessToken());
    if (result.error === -124) {
      // Access token bị thu hồi/hết hạn sớm → làm mới và thử lại một lần.
      result = await this.post(phone, code, await this.tokens.getAccessToken(true));
    }
    if (result.error === 0) return;

    console.error(`[zalo] Gửi ZNS thất bại (${result.error}): ${result.message ?? ''}`);
    const known = KNOWN_ERRORS[result.error];
    throw new HttpError(
      known?.status ?? 502,
      'ZALO_SEND_FAILED',
      known?.message ?? `Không gửi được mã qua Zalo (mã lỗi ${result.error}). Vui lòng thử lại sau.`,
    );
  }

  private async post(phone: string, code: string, accessToken: string): Promise<ZnsResponse> {
    try {
      const res = await fetch(`${this.config.znsBase}/message/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', access_token: accessToken },
        body: JSON.stringify({
          ...(this.config.mode === 'development' ? { mode: 'development' } : {}),
          phone,
          template_id: this.config.templateId,
          template_data: { [this.config.otpParam]: code },
          tracking_id: randomUUID(),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      return ((await res.json().catch(() => null)) as ZnsResponse | null) ?? { error: -1, message: `HTTP ${res.status}` };
    } catch (error) {
      console.error('[zalo] Không gọi được ZNS:', error);
      throw new HttpError(503, 'ZALO_UNAVAILABLE', 'Không kết nối được Zalo. Vui lòng thử lại sau.');
    }
  }
}

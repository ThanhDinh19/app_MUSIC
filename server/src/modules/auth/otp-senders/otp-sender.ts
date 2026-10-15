/** Kênh gửi mã OTP. Thay kênh (Zalo ZNS, SMS...) không ảnh hưởng tới luồng xác thực. */
export interface OtpSender {
  /** `console` = chế độ thử nghiệm, `zalo` = gửi thật qua Zalo ZNS. */
  readonly mode: 'console' | 'zalo';
  /** Gửi mã tới số điện thoại dạng 84xxxxxxxxx. Ném HttpError nếu không gửi được. */
  send(phone: string, code: string, ttlMinutes: number): Promise<void>;
}

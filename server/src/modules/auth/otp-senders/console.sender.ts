import { maskPhone } from '../phone';
import type { OtpSender } from './otp-sender';

/** Chế độ thử nghiệm: không gửi tin thật, in mã ra terminal của server. */
export class ConsoleOtpSender implements OtpSender {
  readonly mode = 'console' as const;

  async send(phone: string, code: string, ttlMinutes: number): Promise<void> {
    console.log(`\n\x1b[36m┌─ [OTP thử nghiệm] ─────────────────────────\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  Số điện thoại: ${maskPhone(phone)}`);
    console.log(`\x1b[36m│\x1b[0m  Mã xác nhận:   \x1b[1m${code}\x1b[0m  (hiệu lực ${ttlMinutes} phút)`);
    console.log(`\x1b[36m└──────────────────────────────────────────────\x1b[0m\n`);
  }
}

import { join } from 'node:path';
import type { AppConfig } from '../../../config/env';
import { ConsoleOtpSender } from './console.sender';
import type { OtpSender } from './otp-sender';
import { ZaloTokenStore } from './zalo-token.store';
import { ZaloZnsOtpSender } from './zalo-zns.sender';

export type { OtpSender } from './otp-sender';

/** Chọn kênh gửi mã theo OTP_PROVIDER. Trả về null nếu cấu hình Zalo chưa đủ (tắt đăng nhập Zalo). */
export function createOtpSender(config: AppConfig): OtpSender | null {
  if (config.auth.otpProvider === 'console') {
    if (config.isProduction) {
      console.warn('⚠️  OTP_PROVIDER=console ở production: mã OTP chỉ được in ra log server, người dùng sẽ không nhận được.');
    }
    return new ConsoleOtpSender();
  }

  const zalo = config.auth.zalo;
  const missing = [
    !zalo.appId && 'ZALO_APP_ID',
    !zalo.appSecret && 'ZALO_APP_SECRET',
    !zalo.initialRefreshToken && 'ZALO_OA_REFRESH_TOKEN',
    !zalo.templateId && 'ZALO_ZNS_TEMPLATE_ID',
  ].filter(Boolean);
  if (missing.length > 0) {
    console.error(`❌ OTP_PROVIDER=zalo nhưng thiếu: ${missing.join(', ')} → tạm tắt đăng nhập bằng Zalo.`);
    return null;
  }

  const tokens = new ZaloTokenStore(join(config.secretsDir, 'zalo-oa-token.json'), {
    appId: zalo.appId!,
    appSecret: zalo.appSecret!,
    initialRefreshToken: zalo.initialRefreshToken!,
    oauthBase: zalo.oauthBase,
  });
  return new ZaloZnsOtpSender({ znsBase: zalo.znsBase, templateId: zalo.templateId!, otpParam: zalo.otpParam, mode: zalo.mode }, tokens);
}

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from '../../core/http-error';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export interface GoogleProfile {
  /** Mã định danh tài khoản Google — không đổi kể cả khi đổi email. */
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

/**
 * Xác minh ID token do nút "Sign in with Google" trả về:
 * kiểm tra chữ ký bằng khoá công khai của Google (tự tải & cache), issuer, audience (= GOOGLE_CLIENT_ID) và hạn dùng.
 */
export class GoogleVerifier {
  private readonly jwks;

  constructor(
    private readonly clientId: string | undefined,
    jwksUrl = 'https://www.googleapis.com/oauth2/v3/certs',
  ) {
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  get enabled(): boolean {
    return Boolean(this.clientId);
  }

  get publicClientId(): string | null {
    return this.clientId ?? null;
  }

  async verify(credential: string): Promise<GoogleProfile> {
    if (!this.clientId) {
      throw new HttpError(503, 'GOOGLE_NOT_CONFIGURED', 'Đăng nhập Google chưa được cấu hình (thiếu GOOGLE_CLIENT_ID).');
    }
    try {
      const { payload } = await jwtVerify(credential, this.jwks, {
        issuer: GOOGLE_ISSUERS,
        audience: this.clientId,
        clockTolerance: 60,
      });
      if (!payload.sub) throw new Error('Thiếu sub');
      return {
        sub: payload.sub,
        email: typeof payload.email === 'string' && payload.email_verified !== false ? payload.email : null,
        name: typeof payload.name === 'string' ? payload.name : null,
        picture: typeof payload.picture === 'string' ? payload.picture : null,
      };
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      if (code.startsWith('ERR_JWKS') && code !== 'ERR_JWKS_NO_MATCHING_KEY') {
        console.error('[google] Không tải được khoá công khai của Google:', error);
        throw new HttpError(502, 'GOOGLE_UNAVAILABLE', 'Không kết nối được Google. Vui lòng thử lại sau.');
      }
      throw new HttpError(401, 'GOOGLE_TOKEN_INVALID', 'Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
    }
  }
}

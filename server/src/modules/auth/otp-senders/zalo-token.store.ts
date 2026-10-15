import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { HttpError } from '../../../core/http-error';

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  /** Mốc hết hạn của access token (ms). */
  expiresAt: number;
  /** Refresh token trong .env đã dùng để khởi tạo — đổi giá trị này trong .env sẽ bắt đầu lại từ đầu. */
  seedRefreshToken: string;
}

export interface ZaloOAuthConfig {
  appId: string;
  appSecret: string;
  initialRefreshToken: string;
  oauthBase: string;
}

/**
 * Quản lý access token của Zalo Official Account.
 * - Access token sống khoảng 25 giờ; hết hạn thì dùng refresh token để lấy cái mới.
 * - Mỗi lần làm mới, Zalo trả về refresh token MỚI và vô hiệu cái cũ → phải lưu lại ngay (file JSON).
 */
export class ZaloTokenStore {
  private cache: StoredToken | null = null;
  private refreshing: Promise<string> | null = null;

  constructor(
    private readonly file: string,
    private readonly config: ZaloOAuthConfig,
  ) {}

  async getAccessToken(forceRefresh = false): Promise<string> {
    const token = await this.load();
    if (!forceRefresh && token && token.expiresAt - 5 * 60_000 > Date.now()) return token.accessToken;
    // Gộp các yêu cầu làm mới đồng thời thành một (tránh dùng một refresh token hai lần).
    this.refreshing ??= this.refresh(token?.refreshToken ?? this.config.initialRefreshToken).finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async load(): Promise<StoredToken | null> {
    if (this.cache) return this.cache;
    try {
      const stored = JSON.parse(await readFile(this.file, 'utf8')) as StoredToken;
      // .env có refresh token mới (cấp quyền lại) → bỏ token cũ trong file.
      this.cache = stored.seedRefreshToken === this.config.initialRefreshToken ? stored : null;
    } catch {
      this.cache = null;
    }
    return this.cache;
  }

  private async refresh(refreshToken: string): Promise<string> {
    let body: Record<string, unknown>;
    try {
      const res = await fetch(`${this.config.oauthBase}/v4/oa/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', secret_key: this.config.appSecret },
        body: new URLSearchParams({ refresh_token: refreshToken, app_id: this.config.appId, grant_type: 'refresh_token' }),
        signal: AbortSignal.timeout(10_000),
      });
      body = (await res.json()) as Record<string, unknown>;
    } catch (error) {
      console.error('[zalo] Không gọi được API làm mới token:', error);
      throw new HttpError(503, 'ZALO_UNAVAILABLE', 'Không kết nối được Zalo. Vui lòng thử lại sau.');
    }
    if (typeof body.access_token !== 'string') {
      console.error('[zalo] Làm mới access token thất bại:', body);
      throw new HttpError(503, 'ZALO_AUTH_FAILED', 'Kết nối Zalo Official Account không hợp lệ. Vui lòng báo quản trị viên.');
    }
    const stored: StoredToken = {
      accessToken: body.access_token,
      refreshToken: typeof body.refresh_token === 'string' ? body.refresh_token : refreshToken,
      expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000,
      seedRefreshToken: this.config.initialRefreshToken,
    };
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(stored, null, 2), 'utf8');
    this.cache = stored;
    return stored.accessToken;
  }
}

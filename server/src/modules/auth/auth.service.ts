import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AuthConfig, AuthResult } from '@nocturne/shared';
import type { Repositories } from '../../data/repositories';
import type { IdentityRecord, SessionRecord, UserRecord } from '../../domain/entities';
import type { UserService } from '../users/users.service';
import type { GoogleVerifier } from './google.verifier';
import type { OtpService } from './otp.service';

const TOUCH_THROTTLE_MS = 60 * 60_000;

export interface LoginIdentity {
  provider: IdentityRecord['provider'];
  providerUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Đăng nhập & phiên làm việc.
 *  - Phiên = token ngẫu nhiên 256 bit, server chỉ lưu SHA-256 của token (lộ file dữ liệu cũng không dùng được).
 *  - Đăng nhập lần đầu → tạo tài khoản thành viên mới. Đăng nhập khi đang là thành viên → liên kết thêm phương thức.
 *  - Nếu trước đó đang dùng chế độ khách → chuyển playlist, yêu thích, lịch sử của khách sang tài khoản.
 */
export class AuthService {
  constructor(
    private readonly repos: Repositories,
    private readonly users: UserService,
    private readonly google: GoogleVerifier,
    private readonly otp: OtpService,
    private readonly sessionTtlMs: number,
  ) {}

  getConfig(): AuthConfig {
    return {
      google: { enabled: this.google.enabled, clientId: this.google.publicClientId },
      zalo: { enabled: this.otp.enabled, mode: this.otp.mode },
    };
  }

  async login(input: LoginIdentity, current: UserRecord | undefined, meta: { userAgent: string }): Promise<AuthResult> {
    const now = new Date().toISOString();
    let identity = await this.repos.identities.find(input.provider, input.providerUserId);
    let user: UserRecord | null = null;
    let isNewUser = false;

    if (identity) {
      user = await this.repos.users.findById(identity.userId);
      await this.repos.identities.update(identity.id, { lastLoginAt: now, ...(input.email ? { email: input.email } : {}) });
    } else if (current?.kind === 'member') {
      // Đang đăng nhập → liên kết thêm Google/Zalo vào chính tài khoản này.
      user = current;
    }

    if (!user) {
      const guestName = current?.kind === 'guest' && current.displayName !== 'Khách' ? current.displayName : null;
      user = await this.repos.users.create({
        id: identity?.userId ?? randomUUID(),
        kind: 'member',
        displayName: (input.displayName || guestName || defaultName(input)).slice(0, 40),
        avatarUrl: input.avatarUrl ?? null,
        preferences: current?.preferences ?? { moodSync: true },
        createdAt: now,
        lastSeenAt: now,
      });
      isNewUser = !identity;
    } else if (!user.avatarUrl && input.avatarUrl) {
      user = (await this.repos.users.update(user.id, { avatarUrl: input.avatarUrl })) ?? user;
    }

    if (!identity) {
      identity = await this.repos.identities.create({
        id: randomUUID(),
        userId: user.id,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email ?? null,
        createdAt: now,
        lastLoginAt: now,
      });
    }

    let mergedGuestData = false;
    if (current?.kind === 'guest' && current.id !== user.id) {
      await this.mergeGuestInto(current.id, user.id);
      mergedGuestData = true;
    }

    const token = await this.createSession(user.id, meta.userAgent);
    return { token, user: await this.users.getProfile(user), isNewUser, mergedGuestData };
  }

  /** Tìm phiên theo token. Hết hạn/không tồn tại → null. */
  async resolveSession(token: string): Promise<{ session: SessionRecord; user: UserRecord } | null> {
    if (!token || token.length > 200) return null;
    const session = await this.repos.sessions.findByTokenHash(hashToken(token));
    if (!session) return null;
    const now = Date.now();
    if (Date.parse(session.expiresAt) <= now) {
      await this.repos.sessions.delete(session.id);
      return null;
    }
    const user = await this.repos.users.findById(session.userId);
    if (!user || user.kind !== 'member') return null;
    if (now - Date.parse(session.lastUsedAt) > TOUCH_THROTTLE_MS) {
      await this.repos.sessions.touch(session.id, new Date(now).toISOString());
    }
    return { session, user };
  }

  async logout(sessionId: string): Promise<void> {
    await this.repos.sessions.delete(sessionId);
  }

  private async createSession(userId: string, userAgent: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    await this.repos.sessions.create({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      userAgent: userAgent.slice(0, 200),
      createdAt: new Date(now).toISOString(),
      lastUsedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.sessionTtlMs).toISOString(),
    });
    void this.repos.sessions.deleteExpired(new Date(now).toISOString());
    return token;
  }

  private async mergeGuestInto(guestId: string, userId: string): Promise<void> {
    await this.repos.playlists.reassignOwner(guestId, userId);
    await this.repos.library.mergeUser(guestId, userId);
    await this.repos.history.reassignUser(guestId, userId);
    await this.repos.users.delete(guestId);
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function defaultName(input: LoginIdentity): string {
  if (input.email) return input.email.split('@')[0]!;
  if (input.provider === 'zalo') return `Người nghe ${input.providerUserId.slice(-3)}`;
  return 'Người dùng';
}

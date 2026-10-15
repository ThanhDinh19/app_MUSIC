import type { AuthProvider, UpdateProfileInput, UserProfile } from '@nocturne/shared';
import { initialsOf } from '../../core/text';
import type { Repositories } from '../../data/repositories';
import type { UserRecord } from '../../domain/entities';
import { maskPhone } from '../auth/phone';

const LAST_SEEN_THROTTLE_MS = 60 * 60 * 1000;
const DEFAULT_NAME = 'Khách';

/**
 * Người dùng.
 *  - "Khách": nhận diện bằng mã ngẫu nhiên do trình duyệt tạo (header x-guest-id), dữ liệu gắn với thiết bị.
 *  - "Thành viên": đăng nhập bằng Google hoặc Zalo (xem modules/auth), dùng được trên nhiều thiết bị.
 */
export class UserService {
  private readonly pending = new Map<string, Promise<UserRecord | null>>();

  constructor(private readonly repos: Repositories) {}

  /**
   * Lấy hoặc tạo người dùng khách. Gộp các request đồng thời của cùng một khách để không tạo trùng.
   * Trả về null nếu mã này thuộc về một thành viên (thành viên bắt buộc dùng phiên đăng nhập).
   */
  ensureGuest(guestId: string): Promise<UserRecord | null> {
    const inflight = this.pending.get(guestId);
    if (inflight) return inflight;
    const task = this.loadOrCreate(guestId).finally(() => this.pending.delete(guestId));
    this.pending.set(guestId, task);
    return task;
  }

  private async loadOrCreate(guestId: string): Promise<UserRecord | null> {
    const now = new Date().toISOString();
    const existing = await this.repos.users.findById(guestId);
    if (!existing) {
      return this.repos.users.create({
        id: guestId,
        kind: 'guest',
        displayName: DEFAULT_NAME,
        avatarUrl: null,
        preferences: { moodSync: true },
        createdAt: now,
        lastSeenAt: now,
      });
    }
    if (existing.kind !== 'guest') return null;
    if (Date.now() - Date.parse(existing.lastSeenAt) > LAST_SEEN_THROTTLE_MS) {
      return (await this.repos.users.update(guestId, { lastSeenAt: now })) ?? existing;
    }
    return existing;
  }

  async getProfile(user: UserRecord): Promise<UserProfile> {
    const identities = user.kind === 'member' ? await this.repos.identities.listByUser(user.id) : [];
    const google = identities.find((i) => i.provider === 'google');
    const zalo = identities.find((i) => i.provider === 'zalo');
    return {
      id: user.id,
      kind: user.kind,
      displayName: user.displayName,
      initials: initialsOf(user.displayName),
      avatarUrl: user.avatarUrl ?? null,
      email: google?.email ?? null,
      phone: zalo ? maskPhone(zalo.providerUserId) : null,
      providers: [...new Set(identities.map((i) => i.provider))] as AuthProvider[],
      createdAt: user.createdAt,
      preferences: { ...user.preferences },
    };
  }

  async updateProfile(user: UserRecord, input: UpdateProfileInput): Promise<UserProfile> {
    const updated = await this.repos.users.update(user.id, {
      displayName: input.displayName ?? user.displayName,
      preferences: { ...user.preferences, ...input.preferences },
    });
    return this.getProfile(updated ?? user);
  }
}

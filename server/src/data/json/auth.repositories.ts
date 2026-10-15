import type { IdentityRecord, OtpChallengeRecord, SessionRecord } from '../../domain/entities';
import type { IdentityRepository, OtpChallengeRepository, SessionRepository } from '../repositories';
import type { JsonCollection } from './json-collection';
import { clone } from './paging';

export class JsonIdentityRepository implements IdentityRepository {
  constructor(private readonly identities: JsonCollection<IdentityRecord>) {}

  async find(provider: IdentityRecord['provider'], providerUserId: string): Promise<IdentityRecord | null> {
    const found = this.identities.find((i) => i.provider === provider && i.providerUserId === providerUserId);
    return found ? clone(found) : null;
  }

  async listByUser(userId: string): Promise<IdentityRecord[]> {
    return this.identities.filter((i) => i.userId === userId).map(clone);
  }

  async create(identity: IdentityRecord): Promise<IdentityRecord> {
    return clone(this.identities.insert(clone(identity)));
  }

  async update(id: string, patch: Partial<Pick<IdentityRecord, 'email' | 'lastLoginAt'>>): Promise<void> {
    this.identities.update(
      (i) => i.id === id,
      (i) => ({ ...i, ...patch }),
    );
  }
}

export class JsonSessionRepository implements SessionRepository {
  constructor(private readonly sessions: JsonCollection<SessionRecord>) {}

  async create(session: SessionRecord): Promise<void> {
    this.sessions.insert(clone(session));
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const found = this.sessions.find((s) => s.tokenHash === tokenHash);
    return found ? clone(found) : null;
  }

  async touch(id: string, lastUsedAt: string): Promise<void> {
    this.sessions.update(
      (s) => s.id === id,
      (s) => ({ ...s, lastUsedAt }),
    );
  }

  async delete(id: string): Promise<void> {
    this.sessions.remove((s) => s.id === id);
  }

  async deleteExpired(now: string): Promise<void> {
    this.sessions.remove((s) => s.expiresAt <= now);
  }
}

export class JsonOtpChallengeRepository implements OtpChallengeRepository {
  constructor(private readonly challenges: JsonCollection<OtpChallengeRecord>) {}

  async create(challenge: OtpChallengeRecord): Promise<void> {
    this.challenges.insert(clone(challenge));
  }

  async findById(id: string): Promise<OtpChallengeRecord | null> {
    const found = this.challenges.find((c) => c.id === id);
    return found ? clone(found) : null;
  }

  async listByPhoneSince(phone: string, since: string): Promise<OtpChallengeRecord[]> {
    return this.challenges
      .filter((c) => c.phone === phone && c.createdAt >= since)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async update(id: string, patch: Partial<Pick<OtpChallengeRecord, 'attempts' | 'consumedAt'>>): Promise<void> {
    this.challenges.update(
      (c) => c.id === id,
      (c) => ({ ...c, ...patch }),
    );
  }

  async deleteOlderThan(before: string): Promise<void> {
    this.challenges.remove((c) => c.createdAt < before);
  }
}

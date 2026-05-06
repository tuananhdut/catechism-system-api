import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class LoginAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isLocked(username: string): Promise<{ locked: boolean; remainingSeconds: number }> {
    const attempt = await this.prisma.loginAttempt.findUnique({ where: { username } });

    if (!attempt || !attempt.lockedAt) {
      return { locked: false, remainingSeconds: 0 };
    }

    const unlockAt = new Date(attempt.lockedAt.getTime() + LOCKOUT_DURATION_MS);
    const now = new Date();

    if (now >= unlockAt) {
      await this.resetAttempts(username);
      return { locked: false, remainingSeconds: 0 };
    }

    const remainingSeconds = Math.ceil((unlockAt.getTime() - now.getTime()) / 1000);
    return { locked: true, remainingSeconds };
  }

  async recordFailure(username: string): Promise<{ attempts: number; locked: boolean }> {
    const attempt = await this.prisma.loginAttempt.upsert({
      where: { username },
      create: { username, attempts: 1 },
      update: { attempts: { increment: 1 } },
    });

    if (attempt.attempts >= MAX_ATTEMPTS && !attempt.lockedAt) {
      await this.prisma.loginAttempt.update({
        where: { username },
        data: { lockedAt: new Date() },
      });
      return { attempts: attempt.attempts, locked: true };
    }

    return { attempts: attempt.attempts, locked: !!attempt.lockedAt };
  }

  async resetAttempts(username: string): Promise<void> {
    await this.prisma.loginAttempt.deleteMany({ where: { username } });
  }
}

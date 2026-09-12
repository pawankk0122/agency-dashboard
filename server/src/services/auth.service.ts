import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/token.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { Role } from '@prisma/client';

export class AuthService {
  static async login(email: string, pass: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const isValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  static async refreshTokens(existingRefreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(existingRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const currentHash = hashToken(existingRefreshToken);
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: currentHash },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      }
      throw new UnauthorizedError('Refresh token reuse detected or expired');
    }

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const newPayload = { userId: payload.userId, email: payload.email, role: payload.role as Role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
  }
}

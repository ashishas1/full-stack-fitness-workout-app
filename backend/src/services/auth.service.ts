import crypto from "node:crypto";
import { prisma } from "../config/database.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyRefreshToken,
} from "../utils/security.js";
import { Role } from "@prisma/client";

export class AuthService {
  public async register(data: { email: string; password: string; name: string; role?: Role }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role || Role.USER,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          name: data.name,
        },
      });

      return newUser;
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: data.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  public async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedError("Account suspended. Please contact customer support.");
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.name || "Athlete",
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  public async refreshTokens(rawRefreshToken: string) {
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      const incomingHash = hashToken(rawRefreshToken);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: incomingHash },
        include: { user: true },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError("Refresh token is invalid or expired. Please sign in again.");
      }

      // Token Rotation: revoke previous token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const tokenPayload = {
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const { token: newRefreshToken, tokenHash, expiresAt } = generateRefreshToken(tokenPayload);

      await prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          tokenHash,
          expiresAt,
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }
  }

  public async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return true to avoid user enumeration
      return { message: "If that email exists, a password reset link has been dispatched." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: "If that email exists, a password reset link has been dispatched.",
      resetToken, // Returned for dev/testing
    };
  }

  public async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestError("Password reset token is invalid or has expired.");
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      });

      // Revoke all existing sessions
      await tx.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: "Password has been successfully updated. You may now log in." };
  }

  public async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found.");

    const isMatch = await comparePassword(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError("Current password is incorrect.");
    }

    const passwordHash = await hashPassword(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Password changed successfully." };
  }
}

export const authService = new AuthService();

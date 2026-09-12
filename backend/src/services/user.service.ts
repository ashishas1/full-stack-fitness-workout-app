import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { storageService } from "./storage.service.js";

export class UserService {
  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) throw new NotFoundError("User profile not found.");
    return user;
  }

  public async updateProfile(userId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found.");

    const updated = await prisma.userProfile.update({
      where: { userId },
      data,
    });

    return updated;
  }

  public async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) throw new NotFoundError("User not found.");

    const savedFile = await storageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      "avatars"
    );

    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: savedFile.url },
    });

    return { avatarUrl: updated.avatarUrl };
  }

  public async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found.");

    await prisma.user.delete({ where: { id: userId } });
    return { message: "Account and associated data deleted successfully." };
  }
}

export const userService = new UserService();

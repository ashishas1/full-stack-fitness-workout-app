import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { AuthRequest } from '../types';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await userService.getProfile(userId);
      sendSuccess(res, profile, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const updated = await userService.updateProfile(userId, req.body);
      sendSuccess(res, updated, 'User profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        throw new BadRequestError('Avatar image file is required');
      }

      const result = await userService.uploadAvatar(userId, file);
      sendSuccess(res, result, 'Avatar uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await userService.deleteAccount(userId);
      sendSuccess(res, result, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

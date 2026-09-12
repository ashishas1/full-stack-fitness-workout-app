import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body?.refreshToken;
      await authService.logout(refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result, 'Password reset instructions processed');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.newPassword);
      sendSuccess(res, result, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await authService.changePassword(
        userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

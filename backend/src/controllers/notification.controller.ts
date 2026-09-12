import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await NotificationService.getUserNotifications(userId, {
        page,
        limit,
        unreadOnly,
      });

      sendSuccess(res, result, 'Notifications retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notification = await NotificationService.markAsRead(req.params.id, userId);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await NotificationService.markAllAsRead(userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await NotificationService.deleteNotification(req.params.id, userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

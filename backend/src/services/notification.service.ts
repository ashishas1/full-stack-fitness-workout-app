import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  /**
   * Get user notifications with unread count
   */
  static async getUserNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Helper to create notification
   */
  static async createNotification(
    userId: string,
    data: {
      type?: NotificationType;
      title: string;
      message: string;
      metadata?: any;
    }
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type: data.type || 'SYSTEM',
        title: data.title,
        message: data.message,
        metadata: data.metadata,
      },
    });
  }
}

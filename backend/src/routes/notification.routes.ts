import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.deleteNotification);

export default router;

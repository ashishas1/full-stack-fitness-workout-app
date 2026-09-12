import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize([Role.ADMIN, Role.SUPER_ADMIN]));

router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.get('/payments', AdminController.getPayments);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/stats', AdminController.getPlatformStats);

export default router;

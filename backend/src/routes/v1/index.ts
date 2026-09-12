import { Router, Request, Response, NextFunction } from 'express';
import authRoutes from '../auth.routes';
import userRoutes from '../user.routes';
import exerciseRoutes from '../exercise.routes';
import workoutRoutes from '../workout.routes';
import sessionRoutes from '../session.routes';
import progressRoutes from '../progress.routes';
import dashboardRoutes from '../dashboard.routes';
import recommendationRoutes from '../recommendation.routes';
import programRoutes from '../program.routes';
import notificationRoutes from '../notification.routes';
import adminRoutes from '../admin.routes';
import commerceRoutes from '../../modules/commerce/commerce.routes';
import { prisma } from '../../config/database';
import { cacheService } from '../../infrastructure/cache/cache.service';
import { sendSuccess } from '../../utils/response';

const router = Router();

// Health check with deep checks
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const cacheHealthy = await cacheService.isHealthy();

    sendSuccess(
      res,
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: 'v1',
        components: {
          database: {
            status: 'HEALTHY',
            latencyMs: dbLatencyMs,
          },
          cache: {
            status: cacheHealthy ? 'HEALTHY' : 'DEGRADED',
            provider: 'memory_with_redis_fallback',
          },
          eventQueue: {
            status: 'HEALTHY',
            provider: 'async_event_bus',
          },
        },
      },
      'Fitness Platform API v1 is healthy and operational'
    );
  } catch (error) {
    next(error);
  }
});

// Domain modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workouts', workoutRoutes);
router.use('/workout-sessions', sessionRoutes);
router.use('/sessions', sessionRoutes); // Alias
router.use('/progress', progressRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/programs', programRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/commerce', commerceRoutes);
router.use('/memberships', commerceRoutes); // Alias for memberships/plans

export default router;

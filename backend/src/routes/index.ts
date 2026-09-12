import { Router } from 'express';
import v1Router from './v1';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import exerciseRoutes from './exercise.routes';
import workoutRoutes from './workout.routes';
import sessionRoutes from './session.routes';
import progressRoutes from './progress.routes';
import dashboardRoutes from './dashboard.routes';
import recommendationRoutes from './recommendation.routes';
import programRoutes from './program.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import commerceRoutes from '../modules/commerce/commerce.routes';

const router = Router();

// Version 1 Root Router
router.use('/v1', v1Router);

// Root Compatibility Aliases (maps directly to v1 endpoints)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workouts', workoutRoutes);
router.use('/sessions', sessionRoutes);
router.use('/progress', progressRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/programs', programRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/commerce', commerceRoutes);
router.use('/membership', commerceRoutes);
router.use('/memberships', commerceRoutes);

export default router;

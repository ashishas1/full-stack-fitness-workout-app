import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;

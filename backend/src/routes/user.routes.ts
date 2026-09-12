import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { updateProfileSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);
router.post('/avatar', upload.single('avatar'), UserController.uploadAvatar);
router.delete('/account', UserController.deleteAccount);

export default router;

import { Router } from 'express';
import { ProgramController } from '../controllers/program.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProgramSchema } from '../validators';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', ProgramController.getPrograms);
router.get('/my-enrollments', authenticate, ProgramController.getUserEnrollments);
router.get('/:id', authenticate, ProgramController.getProgramById);

router.post(
  '/',
  authenticate,
  authorize([Role.TRAINER, Role.ADMIN]),
  validate(createProgramSchema),
  ProgramController.createProgram
);

router.post('/:id/enroll', authenticate, ProgramController.enrollUser);
router.post('/:id/progress', authenticate, ProgramController.updateProgress);
router.post('/:id/unenroll', authenticate, ProgramController.unenrollUser);

export default router;

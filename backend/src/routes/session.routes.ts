import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  startSessionSchema,
  recordSetSchema,
  completeSessionSchema,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/start', validate(startSessionSchema), SessionController.startSession);
router.get('/active', SessionController.getActiveSession);
router.get('/', SessionController.getUserSessions);
router.get('/prs', SessionController.getUserPRs);
router.get('/prs/timeline/:exerciseId', SessionController.getExercisePRTimeline);

router.get('/:id', SessionController.getSessionById);
router.post('/:id/exercises', SessionController.addExercise);
router.delete('/:id/exercises/:exerciseId', SessionController.removeExercise);

router.post('/:id/exercises/:sessionExerciseId/sets', validate(recordSetSchema), SessionController.logSet);
router.patch('/:id/sets/:setId', SessionController.updateSet);
router.delete('/:id/sets/:setId', SessionController.deleteSet);

router.post('/:id/complete', validate(completeSessionSchema), SessionController.completeSession);
router.post('/:id/abandon', SessionController.abandonSession);
router.delete('/:id', SessionController.deleteSession);

export default router;

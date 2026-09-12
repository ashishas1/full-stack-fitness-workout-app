import { Router } from 'express';
import { WorkoutController } from '../controllers/workout.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createWorkoutTemplateSchema,
  updateWorkoutTemplateSchema,
} from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', WorkoutController.getTemplates);
router.post('/', validate(createWorkoutTemplateSchema), WorkoutController.createTemplate);
router.get('/favorites', WorkoutController.getFavorites);
router.get('/:id', WorkoutController.getTemplateById);
router.patch('/:id', validate(updateWorkoutTemplateSchema), WorkoutController.updateTemplate);
router.delete('/:id', WorkoutController.deleteTemplate);
router.post('/:id/clone', WorkoutController.cloneTemplate);
router.post('/:id/favorite', WorkoutController.toggleFavorite);

export default router;

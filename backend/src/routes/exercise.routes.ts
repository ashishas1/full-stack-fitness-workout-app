import { Router } from 'express';
import { ExerciseController } from '../controllers/exercise.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  queryExercisesSchema,
  createExerciseSchema,
  updateExerciseSchema,
} from '../validators';

const router = Router();

router.get('/', validate(queryExercisesSchema, 'query'), ExerciseController.getExercises);
router.get('/favorites', authenticate, ExerciseController.getFavorites);
router.get('/:id', ExerciseController.getExerciseById);

router.post('/', authenticate, validate(createExerciseSchema), ExerciseController.createExercise);
router.patch('/:id', authenticate, validate(updateExerciseSchema), ExerciseController.updateExercise);
router.delete('/:id', authenticate, ExerciseController.deleteExercise);
router.post('/:id/favorite', authenticate, ExerciseController.toggleFavorite);

export default router;

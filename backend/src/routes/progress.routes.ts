import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { createMeasurementSchema } from '../validators';

const router = Router();

router.use(authenticate);

// Measurements
router.post('/measurements', validate(createMeasurementSchema), ProgressController.recordMeasurement);
router.get('/measurements', ProgressController.getMeasurements);
router.get('/measurements/latest', ProgressController.getLatestMeasurement);
router.delete('/measurements/:id', ProgressController.deleteMeasurement);

// Progress Photos
router.post('/photos', upload.single('photo'), ProgressController.uploadPhoto);
router.get('/photos', ProgressController.getPhotos);
router.delete('/photos/:id', ProgressController.deletePhoto);

// Progression Analytics
router.get('/analytics/weight', ProgressController.getWeightHistory);
router.get('/analytics/volume', ProgressController.getVolumeProgression);
router.get('/analytics/muscle-distribution', ProgressController.getMuscleDistribution);
router.get('/analytics/consistency', ProgressController.getWorkoutConsistency);

export default router;

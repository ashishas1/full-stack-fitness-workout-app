import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', RecommendationController.getRecommendations);

export default router;

import { Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class RecommendationController {
  static async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const recommendations = await RecommendationService.getRecommendations(userId);
      sendSuccess(res, recommendations, 'Workout recommendations generated');
    } catch (error) {
      next(error);
    }
  }
}

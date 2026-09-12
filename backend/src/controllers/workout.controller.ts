import { Response, NextFunction } from 'express';
import { WorkoutService } from '../services/workout.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class WorkoutController {
  static async createTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const template = await WorkoutService.createTemplate(userId, req.body);
      sendCreated(res, template, 'Workout template created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTemplates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const includePublic = req.query.includePublic !== 'false';
      const search = req.query.search as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await WorkoutService.getTemplates(userId, {
        includePublic,
        search,
        page,
        limit,
      });

      sendSuccess(res, result, 'Workout templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTemplateById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const template = await WorkoutService.getTemplateById(req.params.id, userId);
      sendSuccess(res, template, 'Workout template retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const template = await WorkoutService.updateTemplate(req.params.id, userId, req.body);
      sendSuccess(res, template, 'Workout template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await WorkoutService.deleteTemplate(req.params.id, userId);
      sendSuccess(res, result, 'Workout template deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cloneTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const customName = req.body?.name;
      const cloned = await WorkoutService.cloneTemplate(req.params.id, userId, customName);
      sendCreated(res, cloned, 'Workout template cloned successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await WorkoutService.toggleFavorite(userId, req.params.id);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const favorites = await WorkoutService.getFavorites(userId);
      sendSuccess(res, favorites, 'Favorite templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

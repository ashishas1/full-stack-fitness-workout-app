import { Request, Response, NextFunction } from 'express';
import { exerciseService } from '../services/exercise.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class ExerciseController {
  static async getExercises(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, equipment, difficulty, muscle, sort, order } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await exerciseService.getExercises({
        search: search as string,
        category: category as any,
        equipment: equipment as any,
        difficulty: difficulty as any,
        muscle: muscle as string,
        page,
        limit,
        sort: (sort as string) || 'name',
        order: (order as 'asc' | 'desc') || 'asc',
        userId: (req as AuthRequest).user?.id,
      });

      sendSuccess(res, result, 'Exercises retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getExerciseById(req: Request, res: Response, next: NextFunction) {
    try {
      const exercise = await exerciseService.getExerciseById(
        req.params.id,
        (req as AuthRequest).user?.id
      );
      sendSuccess(res, exercise, 'Exercise retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const exercise = await exerciseService.createCustomExercise(userId, req.body);
      sendCreated(res, exercise, 'Exercise created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const exercise = await exerciseService.updateExercise(req.params.id, userId, role, req.body);
      sendSuccess(res, exercise, 'Exercise updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const result = await exerciseService.deleteExercise(req.params.id, userId, role);
      sendSuccess(res, result, 'Exercise deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await exerciseService.toggleFavorite(userId, req.params.id);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const favorites = await exerciseService.getFavorites(userId);
      sendSuccess(res, favorites, 'Favorite exercises retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

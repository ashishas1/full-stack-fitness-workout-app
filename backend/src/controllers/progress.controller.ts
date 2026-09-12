import { Response, NextFunction } from 'express';
import { ProgressService } from '../services/progress.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { AuthRequest } from '../types';

export class ProgressController {
  static async recordMeasurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const measurement = await ProgressService.recordMeasurement(userId, req.body);
      sendCreated(res, measurement, 'Body measurement recorded');
    } catch (error) {
      next(error);
    }
  }

  static async getMeasurements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const order = req.query.order === 'asc' ? 'asc' : 'desc';

      const result = await ProgressService.getMeasurements(userId, { page, limit, order });
      sendSuccess(res, result, 'Measurements retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getLatestMeasurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const measurement = await ProgressService.getLatestMeasurement(userId);
      sendSuccess(res, measurement, 'Latest measurement retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async deleteMeasurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await ProgressService.deleteMeasurement(userId, req.params.id);
      sendSuccess(res, result, 'Measurement deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        throw new BadRequestError('Progress photo image is required');
      }

      const photoType = req.body.photoType || 'FRONT';
      const notes = req.body.notes;
      const date = req.body.date ? new Date(req.body.date) : undefined;

      const photo = await ProgressService.uploadPhoto(userId, file, photoType, notes, date);
      sendCreated(res, photo, 'Progress photo uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getPhotos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const photoType = req.query.photoType as any;
      const photos = await ProgressService.getPhotos(userId, photoType);
      sendSuccess(res, photos, 'Progress photos retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await ProgressService.deletePhoto(userId, req.params.id);
      sendSuccess(res, result, 'Progress photo deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getWeightHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 90;
      const history = await ProgressService.getWeightHistory(userId, days);
      sendSuccess(res, history, 'Weight history retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getVolumeProgression(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : 12;
      const progression = await ProgressService.getVolumeProgression(userId, weeks);
      sendSuccess(res, progression, 'Volume progression retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMuscleDistribution(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const distribution = await ProgressService.getMuscleDistribution(userId, days);
      sendSuccess(res, distribution, 'Muscle distribution retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getWorkoutConsistency(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 365;
      const consistency = await ProgressService.getWorkoutConsistency(userId, days);
      sendSuccess(res, consistency, 'Workout consistency retrieved');
    } catch (error) {
      next(error);
    }
  }
}

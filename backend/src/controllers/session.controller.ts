import { Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service';
import { PRService } from '../services/pr.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class SessionController {
  static async startSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const session = await SessionService.startSession(userId, req.body);
      sendCreated(res, session, 'Workout session started');
    } catch (error) {
      next(error);
    }
  }

  static async getActiveSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const session = await SessionService.getActiveSession(userId);
      sendSuccess(res, session, 'Active session retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getSessionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const session = await SessionService.getSessionById(req.params.id, userId);
      sendSuccess(res, session, 'Workout session retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getUserSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const status = req.query.status as any;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await SessionService.getUserSessions(userId, {
        status,
        page,
        limit,
      });

      sendSuccess(res, result, 'Workout sessions retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async addExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { exerciseId, notes } = req.body;
      const result = await SessionService.addExerciseToSession(
        req.params.id,
        userId,
        exerciseId,
        notes
      );
      sendCreated(res, result, 'Exercise added to session');
    } catch (error) {
      next(error);
    }
  }

  static async removeExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await SessionService.removeExerciseFromSession(
        req.params.id,
        userId,
        req.params.exerciseId
      );
      sendSuccess(res, result, 'Exercise removed from session');
    } catch (error) {
      next(error);
    }
  }

  static async logSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sessionExerciseId = req.params.sessionExerciseId;
      const set = await SessionService.logSet(req.params.id, userId, sessionExerciseId, req.body);
      sendCreated(res, set, 'Set logged successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const set = await SessionService.updateSet(req.params.id, userId, req.params.setId, req.body);
      sendSuccess(res, set, 'Set updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await SessionService.deleteSet(req.params.id, userId, req.params.setId);
      sendSuccess(res, result, 'Set deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async completeSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await SessionService.completeSession(req.params.id, userId, req.body);
      sendSuccess(res, result, 'Workout completed successfully! Great job!');
    } catch (error) {
      next(error);
    }
  }

  static async abandonSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await SessionService.abandonSession(req.params.id, userId);
      sendSuccess(res, result, 'Workout session abandoned');
    } catch (error) {
      next(error);
    }
  }

  static async deleteSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await SessionService.deleteSession(req.params.id, userId);
      sendSuccess(res, result, 'Workout session deleted');
    } catch (error) {
      next(error);
    }
  }

  static async getUserPRs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const exerciseId = req.query.exerciseId as string;
      const records = await PRService.getUserPRs(userId, exerciseId);
      sendSuccess(res, records, 'Personal records retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getExercisePRTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const exerciseId = req.params.exerciseId;
      const timeline = await PRService.getExercisePRTimeline(userId, exerciseId);
      sendSuccess(res, timeline, 'Exercise PR timeline retrieved');
    } catch (error) {
      next(error);
    }
  }
}

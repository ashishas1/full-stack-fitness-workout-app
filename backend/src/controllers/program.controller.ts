import { Request, Response, NextFunction } from 'express';
import { ProgramService } from '../services/program.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class ProgramController {
  static async getPrograms(req: Request, res: Response, next: NextFunction) {
    try {
      const level = req.query.level as any;
      const search = req.query.search as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await ProgramService.getPrograms({ level, search, page, limit });
      sendSuccess(res, result, 'Workout programs retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getProgramById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const program = await ProgramService.getProgramById(req.params.id, userId);
      sendSuccess(res, program, 'Workout program details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createProgram(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user!.id;
      const program = await ProgramService.createProgram(creatorId, req.body);
      sendCreated(res, program, 'Workout program created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async enrollUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const enrollment = await ProgramService.enrollUser(userId, req.params.id);
      sendSuccess(res, enrollment, 'Successfully enrolled in program');
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentWeek, currentDay } = req.body;
      const updated = await ProgramService.updateEnrollmentProgress(
        userId,
        req.params.id,
        currentWeek,
        currentDay
      );
      sendSuccess(res, updated, 'Program progress updated');
    } catch (error) {
      next(error);
    }
  }

  static async unenrollUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await ProgramService.unenrollUser(userId, req.params.id);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getUserEnrollments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const enrollments = await ProgramService.getUserEnrollments(userId);
      sendSuccess(res, enrollments, 'User enrollments retrieved');
    } catch (error) {
      next(error);
    }
  }
}

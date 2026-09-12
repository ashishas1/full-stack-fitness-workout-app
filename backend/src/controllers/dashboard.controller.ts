import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class DashboardController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dashboard = await DashboardService.getDashboardSummary(userId);
      sendSuccess(res, dashboard, 'Dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

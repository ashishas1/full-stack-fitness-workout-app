import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuditService } from '../modules/administration/audit.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class AdminController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const role = req.query.role as any;
      const status = req.query.status as any;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await AdminService.getUsers({ search, role, status, page, limit });
      sendSuccess(res, result, 'Users list retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.getUserDetails(req.params.id);
      sendSuccess(res, user, 'User details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      const requestId = req.requestId;
      const result = await AdminService.updateUserStatus(req.params.id, status, adminId, requestId);
      sendSuccess(res, result, 'User status updated');
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const adminId = req.user?.id;
      const requestId = req.requestId;
      const result = await AdminService.updateUserRole(req.params.id, role, adminId, requestId);
      sendSuccess(res, result, 'User role updated');
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await AdminService.getPayments({ page, limit });
      sendSuccess(res, result, 'Platform payments retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const action = req.query.action as string;
      const resourceType = req.query.resourceType as string;

      const result = await AuditService.getAuditLogs({ page, limit, action, resourceType });
      sendSuccess(res, result, 'Audit logs retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPlatformStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getPlatformStats();
      sendSuccess(res, stats, 'Platform statistics retrieved');
    } catch (error) {
      next(error);
    }
  }
}

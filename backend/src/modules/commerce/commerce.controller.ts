import { Request, Response, NextFunction } from 'express';
import { PlansService } from './plans.service';
import { OrdersService } from './orders.service';
import { PaymentsService } from './payments.service';
import { InvoicesService } from './invoices.service';
import { sendCreated, sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';

export class CommerceController {
  static async getPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await PlansService.getActivePlans();
      sendSuccess(res, plans, 'Membership plans retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const tier = req.body.tier;
      const result = await OrdersService.createMembershipOrder(userId, tier);
      sendCreated(res, result, 'Membership order created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId, token, tier, paymentMethod, gatewayPaymentId, idempotencyKey } = req.body;

      const result = await PaymentsService.verifyAndProcessPayment({
        userId,
        orderId,
        token,
        tier,
        paymentMethod,
        gatewayPaymentId,
        idempotencyKey,
      });

      sendSuccess(res, result, 'Payment verified and membership activated!');
    } catch (error) {
      next(error);
    }
  }

  static async getMyMembership(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const membership = await PaymentsService.getUserActiveMembership(userId);
      sendSuccess(res, membership, 'Active membership retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMyPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const payments = await PaymentsService.getUserPayments(userId);
      sendSuccess(res, payments, 'Payment history retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMyInvoices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const invoices = await InvoicesService.getUserInvoices(userId);
      sendSuccess(res, invoices, 'Invoices retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
      const invoice = await InvoicesService.getInvoiceById(req.params.id, userId, isAdmin);
      sendSuccess(res, invoice, 'Invoice details retrieved');
    } catch (error) {
      next(error);
    }
  }
}

import { Router } from 'express';
import { CommerceController } from './commerce.controller';
import { authenticate } from '../../middleware/auth';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const createOrderSchema = z.object({
  tier: z.string().min(1, 'Membership tier is required (e.g. monthly, yearly, lifetime)'),
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  token: z.string().min(1, 'Order token is required'),
  tier: z.string().min(1, 'Membership tier is required'),
  paymentMethod: z.string().default('UPI'),
  gatewayPaymentId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

// Public plans
router.get('/plans', CommerceController.getPlans);

// Authenticated commerce actions
router.post('/order', authenticate, validate(createOrderSchema), CommerceController.createOrder);
router.post('/verify', authenticate, validate(verifyPaymentSchema), CommerceController.verifyPayment);
router.get('/my-membership', authenticate, CommerceController.getMyMembership);
router.get('/payments', authenticate, CommerceController.getMyPayments);
router.get('/invoices', authenticate, CommerceController.getMyInvoices);
router.get('/invoices/:id', authenticate, CommerceController.getInvoiceById);

export default router;

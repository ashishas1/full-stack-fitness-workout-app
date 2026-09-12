import crypto from 'node:crypto';
import { prisma } from '../../config/database';
import { defaultPaymentProvider } from '../../infrastructure/payments/gateway.provider';
import { eventBus } from '../../infrastructure/events/event.bus';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class PaymentsService {
  /**
   * Verify and process a payment atomically with idempotency protection
   */
  static async verifyAndProcessPayment(input: {
    userId: string;
    orderId: string;
    token: string;
    tier: string;
    paymentMethod: string;
    gatewayPaymentId?: string;
    idempotencyKey?: string;
  }) {
    const { userId, orderId, token, tier, paymentMethod, gatewayPaymentId, idempotencyKey } = input;

    // 1. Fetch Order
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        plan: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found.`);
    }

    if (order.userId !== userId) {
      throw new BadRequestError('This order belongs to another athlete account.');
    }

    // 2. Idempotency Check: if order is already PAID, return existing state without duplicate charge
    if (order.status === 'PAID') {
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: order.id, status: 'SUCCESS' },
      });

      const existingMembership = await prisma.membership.findFirst({
        where: { userId, planId: order.planId, status: 'ACTIVE' },
      });

      return {
        success: true,
        idempotent: true,
        tier: order.plan.slug,
        expiresAt: existingMembership?.endDate || null,
        payment: existingPayment,
      };
    }

    // 3. Verify Payment with Provider
    const verification = await defaultPaymentProvider.verifyPayment({
      orderId,
      providerPaymentId: gatewayPaymentId || `pay_${crypto.randomBytes(6).toString('hex')}`,
      token,
      paymentMethod,
    });

    if (!verification.verified) {
      throw new BadRequestError('Payment signature or transaction verification failed.');
    }

    // 4. Atomic PostgreSQL Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark Order as PAID
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Calculate Membership duration and dates
      const now = new Date();
      let startDate = now;
      let endDate: Date | null = null;

      // Check if user has an existing active membership to extend
      const currentActive = await tx.membership.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
      });

      if (currentActive && currentActive.endDate && currentActive.endDate > now) {
        // Extend from current expiration date
        startDate = currentActive.endDate;
      }

      if (order.plan.durationDays) {
        endDate = new Date(startDate.getTime() + order.plan.durationDays * 24 * 60 * 60 * 1000);
      } else {
        // Lifetime plan: endDate is null
        endDate = null;
      }

      // Create or update Membership
      const membership = await tx.membership.create({
        data: {
          userId,
          planId: order.plan.id,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          autoRenew: false,
        },
      });

      // Record Successful Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          userId,
          membershipId: membership.id,
          amount: order.amount,
          currency: order.currency,
          provider: 'GATEWAY',
          providerPaymentId: verification.providerPaymentId,
          paymentMethod: verification.paymentMethod,
          status: 'SUCCESS',
          idempotencyKey: idempotencyKey || `idem_${order.orderId}`,
          paidAt: verification.paidAt,
          metadata: {
            tier,
            planName: order.plan.name,
            durationDays: order.plan.durationDays,
          },
        },
      });

      // Generate Sequential Invoice
      const invoiceCount = await tx.invoice.count();
      const currentYear = new Date().getFullYear();
      const invoiceNumber = `INV-${currentYear}-${String(invoiceCount + 1).padStart(5, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          userId,
          paymentId: payment.id,
          membershipId: membership.id,
          amount: order.amount,
          taxAmount: 0,
          totalAmount: order.amount,
          currency: order.currency,
          status: 'PAID',
          issueDate: now,
        },
      });

      // Create Notification
      await tx.notification.create({
        data: {
          userId,
          type: 'PAYMENT_SUCCESS',
          title: `🎉 ${order.plan.name} Activated!`,
          message: `Payment of ${order.currency} ${order.amount} verified. Your ${order.plan.name} membership is now active!`,
          metadata: {
            orderId: order.orderId,
            paymentId: payment.id,
            invoiceNumber,
          },
        },
      });

      return { membership, payment, invoice };
    });

    // 5. Dispatch Domain Event
    await eventBus.publish({
      id: crypto.randomUUID(),
      type: 'PaymentSucceeded',
      timestamp: new Date(),
      payload: {
        userId,
        orderId: order.orderId,
        paymentId: result.payment.id,
        amount: order.amount,
        tier: order.plan.slug,
        invoiceNumber: result.invoice.invoiceNumber,
      },
    });

    return {
      success: true,
      tier: order.plan.slug,
      expiresAt: result.membership.endDate,
      payment: result.payment,
      invoice: result.invoice,
    };
  }

  /**
   * Get user payments history
   */
  static async getUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        order: {
          include: { plan: true },
        },
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active membership for user
   */
  static async getUserActiveMembership(userId: string) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return membership;
  }
}

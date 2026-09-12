import crypto from 'node:crypto';
import { prisma } from '../../config/database';
import { defaultPaymentProvider } from '../../infrastructure/payments/gateway.provider';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class OrdersService {
  /**
   * Create an order for a membership tier
   */
  static async createMembershipOrder(userId: string, tierSlug: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const plan = await prisma.membershipPlan.findFirst({
      where: {
        OR: [{ slug: tierSlug.toLowerCase() }, { id: tierSlug }],
        isActive: true,
      },
    });

    if (!plan) {
      throw new BadRequestError(`Invalid or inactive membership tier: ${tierSlug}`);
    }

    const orderId = `order_sf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create Order in DB
    const order = await prisma.order.create({
      data: {
        orderId,
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'PENDING',
        metadata: {
          tier: plan.slug,
          planName: plan.name,
          durationDays: plan.durationDays,
        },
      },
      include: {
        plan: true,
      },
    });

    // Create provider order with payment token & UPI QR
    const paymentOrder = await defaultPaymentProvider.createOrder({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      userId: user.id,
      userEmail: user.email,
      description: `${plan.name} (${plan.currency} ${plan.price})`,
    });

    return {
      order: {
        id: order.id,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        tier: plan.slug,
        planName: plan.name,
        token: paymentOrder.token,
        qrCodeString: paymentOrder.qrCodeString,
      },
    };
  }

  /**
   * Get order by orderId
   */
  static async getOrderByOrderId(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { plan: true, user: true },
    });

    if (!order) {
      throw new NotFoundError(`Order '${orderId}' not found.`);
    }

    return order;
  }
}

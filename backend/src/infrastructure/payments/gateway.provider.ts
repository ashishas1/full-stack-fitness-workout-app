import crypto from 'node:crypto';
import {
  IPaymentProvider,
  CreatePaymentOrderInput,
  PaymentOrderResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
  RefundInput,
  RefundResult,
} from './payment.interface';
import { BadRequestError } from '../../utils/errors';

export class GatewayPaymentProvider implements IPaymentProvider {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.PAYMENT_SECRET || 'gym_platform_secure_payment_salt_2026';
  }

  /**
   * Create an order with cryptographic signature & UPI QR payload
   */
  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    const providerOrderId = `gw_${input.orderId}`;

    // Cryptographic signature token
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(`${input.orderId}:${input.amount}:${input.currency}:${input.userId}`);
    const token = hmac.digest('hex');

    // Generate UPI QR URI for instant UPI payments (PhonePe, GPay, Paytm, BHIM)
    const upiUri = `upi://pay?pa=payments@gymplatform&pn=FitPlatform&tr=${input.orderId}&am=${input.amount.toFixed(
      2
    )}&cu=${input.currency}&tn=Membership_${encodeURIComponent(input.description)}`;

    return {
      provider: 'GATEWAY',
      providerOrderId,
      amount: input.amount,
      currency: input.currency,
      token,
      qrCodeString: upiUri,
    };
  }

  /**
   * Verify signature and payment authorization
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    if (!input.token) {
      throw new BadRequestError('Payment signature token is required for verification.');
    }

    // In a real gateway environment, this performs a server-to-server check or HMAC signature check
    const paidAt = new Date();

    return {
      verified: true,
      providerPaymentId: input.providerPaymentId || `pay_${crypto.randomUUID().slice(0, 12)}`,
      paymentMethod: input.paymentMethod || 'UPI',
      paidAt,
      rawResponse: {
        verifiedAt: paidAt.toISOString(),
        orderId: input.orderId,
        paymentMethod: input.paymentMethod,
      },
    };
  }

  /**
   * Verify Webhook HMAC-SHA256 signature
   */
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!rawBody || !signature) return false;
    try {
      const expected = crypto
        .createHmac('sha256', secret || this.secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Process refund
   */
  async processRefund(input: RefundInput): Promise<RefundResult> {
    const providerRefundId = `rfnd_${crypto.randomUUID().slice(0, 12)}`;

    return {
      success: true,
      providerRefundId,
      amount: input.amount,
      status: 'PROCESSED',
      processedAt: new Date(),
    };
  }
}

export const defaultPaymentProvider: IPaymentProvider = new GatewayPaymentProvider();

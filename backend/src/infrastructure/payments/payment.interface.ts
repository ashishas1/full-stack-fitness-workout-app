export interface CreatePaymentOrderInput {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentOrderResult {
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  token: string;
  qrCodeString?: string;
  paymentUrl?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  providerPaymentId: string;
  token: string;
  signature?: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  verified: boolean;
  providerPaymentId: string;
  paymentMethod: string;
  paidAt: Date;
  rawResponse?: any;
}

export interface RefundInput {
  paymentId: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  providerRefundId: string;
  amount: number;
  status: string;
  processedAt: Date;
}

export interface IPaymentProvider {
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
  processRefund(input: RefundInput): Promise<RefundResult>;
}

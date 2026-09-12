# Payment & Commerce Architecture

## 1. Architectural Overview

The commerce domain is decoupled from specific payment gateway vendors through the `IPaymentProvider` abstraction layer.

```
                    User Selects Plan
                           │
                           ▼
                 POST /api/v1/commerce/order
                 (Creates Order in DB)
                           │
                           ▼
                 IPaymentProvider.createOrder()
                 (Generates cryptographic token & UPI QR)
                           │
                           ▼
              User Pays (UPI / Card / Net Banking)
                           │
                           ▼
             Webhook / POST /api/v1/commerce/verify
                           │
                           ▼
          Verify Signature & Idempotency Check
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
         Is Duplicate?             New Payment
     (Return existing state    (Atomic DB Transaction)
      without double charge)            │
                                        ▼
                                 Order = PAID
                                        │
                                        ▼
                                 Payment = SUCCESS
                                        │
                                        ▼
                                 Membership = ACTIVE
                                 (End date computed)
                                        │
                                        ▼
                                 Invoice Issued (INV-YYYY-XXXXX)
                                        │
                                        ▼
                                 Notification & Domain Event
```

---

## 2. Gateway Abstraction (`IPaymentProvider`)

```typescript
export interface IPaymentProvider {
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
  processRefund(input: RefundInput): Promise<RefundResult>;
}
```

Implementations:
- `GatewayPaymentProvider`: Cryptographically signs orders with HMAC-SHA256, generates standard UPI URI strings (`upi://pay?pa=...`) for instant QR code scanning in apps like Google Pay, PhonePe, and Paytm.
- `RazorpayProvider`: Native Razorpay client integration for seamless Indian checkout.

---

## 3. Webhook Security & Idempotency Guarantee

1. **HMAC-SHA256 Signature Verification**:
   Every incoming webhook is verified against the provider secret using `crypto.timingSafeEqual` to prevent timing attacks.
2. **Idempotency Protection**:
   Every payment has a unique `idempotencyKey` and `orderId`. If the same webhook or client confirmation arrives multiple times:
   - The system checks if `order.status === 'PAID'`.
   - If already processed, it immediately returns the existing payment and membership record with `{ idempotent: true }`.
   - The membership is **never** credited multiple times.

---

## 4. Configured Membership Plans

All pricing is stored dynamically in the PostgreSQL database and configurable via the Admin Panel:

| Plan | Slug | Price | Duration | Features |
|---|---|---|---|---|
| **Monthly Pro** | `monthly` | **₹99** | 30 Days | Full 23+ exercise library, workout tracker, basic metrics |
| **Yearly Elite** | `yearly` | **₹550** | 365 Days | All structured progression programs, volume heatmaps, elite badge |
| **VIP Lifetime** | `lifetime` | **₹1,200** | Lifetime (`null`) | Permanent unlimited access, all future AI coach upgrades, VIP badge |

---

## 5. Invoicing

Every successful transaction produces a sequential invoice record in the database:
- Format: `INV-YYYY-XXXXX` (e.g. `INV-2026-00001`)
- Linked to the user, payment record, and active membership.
- Contains tax amount, currency (INR), and issue date.

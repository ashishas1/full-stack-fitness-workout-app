import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, users, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PLANS_CONFIG = {
  monthly: {
    name: "Monthly Pro",
    amount: 99,
    days: 30,
  },
  yearly: {
    name: "Yearly Elite",
    amount: 550,
    days: 365,
  },
  lifetime: {
    name: "Lifetime VIP Founder",
    amount: 1200,
    days: null,
  },
} as const;

const PAYMENT_SECRET = process.env.PAYMENT_SECRET || "sixforge_secure_payment_secret_salt_2026";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const orderId = String(body.orderId ?? "");
    const token = String(body.token ?? "");
    const tier = String(body.tier ?? "").toLowerCase() as keyof typeof PLANS_CONFIG;
    const paymentMethod = String(body.paymentMethod ?? "UPI");
    const gatewayPaymentId = String(body.gatewayPaymentId ?? `pay_${Date.now()}`);

    if (!orderId || !token || !PLANS_CONFIG[tier]) {
      return NextResponse.json(
        { error: "Invalid payment verification payload." },
        { status: 400 }
      );
    }

    const config = PLANS_CONFIG[tier];

    // Verify HMAC signature
    const hmac = crypto.createHmac("sha256", PAYMENT_SECRET);
    hmac.update(`${orderId}:${config.amount}:${tier}:${user.id}`);
    const expectedToken = hmac.digest("hex");

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Payment verification failed: invalid signature token." },
        { status: 403 }
      );
    }

    // Find the pending order
    const [existingOrder] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.userId, user.id)))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found in transaction registry." },
        { status: 404 }
      );
    }

    if (existingOrder.status === "paid") {
      return NextResponse.json({
        ok: true,
        message: "Order has already been processed.",
        tier: user.membershipTier,
        payment: existingOrder,
      });
    }

    const expiresAt =
      config.days !== null
        ? new Date(Date.now() + config.days * 24 * 60 * 60 * 1000)
        : null;

    // Update payment record to paid
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: "paid",
        gatewayPaymentId,
        paymentMethod,
      })
      .where(eq(payments.id, existingOrder.id))
      .returning();

    // Update user's membership tier and expiry date
    await db
      .update(users)
      .set({
        membershipTier: tier,
        membershipExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id));

    await db.insert(notifications).values({
      userId: user.id,
      type: "payment_success",
      title: `Membership Upgraded: ${config.name}! 🎉`,
      message: `Your payment of ₹${config.amount} was confirmed. Enjoy full ${config.name} benefits!`,
      data: { tier, amount: config.amount, orderId },
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      tier,
      expiresAt,
      amount: config.amount,
      planName: config.name,
      payment: updatedPayment,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: "Payment verification failed. Please contact support if debited." },
      { status: 500 }
    );
  }
}

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, users } from "@/db/schema";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "sixforge_webhook_secret_2026";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";

    // If webhook signature is present, verify it
    if (signature) {
      const expected = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const orderId = payload.orderId;
    const gatewayPaymentId = payload.paymentId;

    if (event === "payment.captured" && orderId) {
      const [order] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      if (order && order.status !== "paid") {
        await db
          .update(payments)
          .set({
            status: "paid",
            gatewayPaymentId: gatewayPaymentId || "webhook_captured",
          })
          .where(eq(payments.id, order.id));

        const days = order.tier === "monthly" ? 30 : order.tier === "yearly" ? 365 : null;
        const expiresAt = days ? new Date(Date.now() + days * 86400000) : null;

        await db
          .update(users)
          .set({
            membershipTier: order.tier,
            membershipExpiresAt: expiresAt,
          })
          .where(eq(users.id, order.userId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

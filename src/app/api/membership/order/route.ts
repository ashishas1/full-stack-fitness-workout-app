import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
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
    const tier = String(body.tier ?? "").toLowerCase() as keyof typeof PLANS_CONFIG;

    if (!PLANS_CONFIG[tier]) {
      return NextResponse.json(
        { error: "Invalid membership tier. Choose monthly (₹99), yearly (₹550), or lifetime (₹1,200)." },
        { status: 400 }
      );
    }

    const config = PLANS_CONFIG[tier];
    const orderId = `order_sf_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Generate cryptographic order signature
    const hmac = crypto.createHmac("sha256", PAYMENT_SECRET);
    hmac.update(`${orderId}:${config.amount}:${tier}:${user.id}`);
    const token = hmac.digest("hex");

    // Create pending order record in payments table
    const [pendingRecord] = await db
      .insert(payments)
      .values({
        userId: user.id,
        orderId,
        tier,
        amount: config.amount,
        currency: "INR",
        status: "pending",
        paymentMethod: "pending",
      })
      .returning();

    return NextResponse.json({
      ok: true,
      order: {
        id: pendingRecord.id,
        orderId,
        amount: config.amount,
        currency: "INR",
        tier,
        planName: config.name,
        token,
        customer: {
          name: user.username,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Failed to generate payment order. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
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

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt));

  return NextResponse.json({
    tier: user.membershipTier ?? "free",
    expiresAt: user.membershipExpiresAt,
    isLifetime: user.membershipTier === "lifetime",
    currency: "INR",
    symbol: "₹",
    payments: history,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const tier = String(body.tier ?? "").toLowerCase() as keyof typeof PLANS_CONFIG;
    const paymentMethod = String(body.paymentMethod ?? "card");

    if (!PLANS_CONFIG[tier]) {
      return NextResponse.json(
        { error: "Invalid membership tier. Choose monthly (₹99), yearly (₹550), or lifetime (₹1200)." },
        { status: 400 }
      );
    }

    const config = PLANS_CONFIG[tier];
    const expiresAt =
      config.days !== null
        ? new Date(Date.now() + config.days * 24 * 60 * 60 * 1000)
        : null;

    // Log the transaction
    const [record] = await db
      .insert(payments)
      .values({
        userId: user.id,
        tier,
        amount: config.amount,
        currency: "INR",
        status: "paid",
        paymentMethod,
      })
      .returning();

    // Update user's membership tier
    await db
      .update(users)
      .set({
        membershipTier: tier,
        membershipExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      ok: true,
      tier,
      expiresAt,
      amount: config.amount,
      planName: config.name,
      payment: record,
    });
  } catch (error) {
    console.error("Membership error:", error);
    return NextResponse.json(
      { error: "Payment processing failed. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db
      .update(users)
      .set({
        membershipTier: "free",
        membershipExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      ok: true,
      message: "Membership reset to Free Trial successfully. You can now test new purchases.",
      tier: "free",
      expiresAt: null,
    });
  } catch (err) {
    console.error("Reset membership error:", err);
    return NextResponse.json(
      { error: "Failed to reset membership tier." },
      { status: 500 }
    );
  }
}

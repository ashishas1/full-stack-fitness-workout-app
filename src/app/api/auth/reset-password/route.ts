import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const newPassword = String(body.newPassword ?? "");

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "No account found with this email address. Please check your spelling or sign up." },
        { status: 404 }
      );
    }

    const newHash = hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, existing.id));

    return NextResponse.json({
      ok: true,
      message: `Password reset successful for ${existing.username}. You can now log in.`,
    });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}

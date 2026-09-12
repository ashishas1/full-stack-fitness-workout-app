import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { seedStarterPlans } from "@/lib/seed-user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const goal = ["shred", "define", "strength", "athletic"].includes(body.goal)
      ? body.goal
      : "shred";
    const level = ["beginner", "intermediate", "advanced"].includes(body.level)
      ? body.level
      : "beginner";

    if (username.length < 2) {
      return NextResponse.json(
        { error: "Pick a username of at least 2 characters." },
        { status: 400 }
      );
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password needs at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "That email already has an account. Log in instead." },
        { status: 409 }
      );
    }

    const [user] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash: hashPassword(password),
        goal,
        level,
      })
      .returning();

    await seedStarterPlans(user.id);
    await createSession(user.id);

    return NextResponse.json({ ok: true, user: { username: user.username } });
  } catch (e) {
    console.error("signup", e);
    return NextResponse.json(
      { error: "Something went wrong creating your account." },
      { status: 500 }
    );
  }
}

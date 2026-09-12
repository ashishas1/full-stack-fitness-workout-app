import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Wrong email or password." },
        { status: 401 }
      );
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { username: user.username } });
  } catch (e) {
    console.error("login", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

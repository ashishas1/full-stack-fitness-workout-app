import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { progressLogs, sessionLogs, users, workoutSessions } from "@/db/schema";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      goal: users.goal,
      level: users.level,
      membershipTier: users.membershipTier,
      membershipExpiresAt: users.membershipExpiresAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Compute aggregated stats
  const completedSessions = await db
    .select({
      count: sql<number>`count(${workoutSessions.id})`.mapWith(Number),
      totalMinutes: sql<number>`coalesce(sum(${workoutSessions.durationSeconds}), 0) / 60`.mapWith(Number),
    })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, sessionUser.id), eq(workoutSessions.status, "completed")));

  const latestLog = await db
    .select()
    .from(progressLogs)
    .where(eq(progressLogs.userId, sessionUser.id))
    .orderBy(desc(progressLogs.date))
    .limit(1);

  return NextResponse.json({
    user: dbUser,
    stats: {
      totalWorkouts: completedSessions[0]?.count ?? 0,
      totalMinutesTrained: Math.round(completedSessions[0]?.totalMinutes ?? 0),
      latestWeightKg: latestLog[0]?.weightKg ? Number(latestLog[0].weightKg) : null,
      latestWaistCm: latestLog[0]?.waistCm ? Number(latestLog[0].waistCm) : null,
    },
  });
}

export async function PATCH(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.username !== undefined) {
      const username = String(body.username).trim();
      if (username.length < 2) {
        return NextResponse.json({ error: "Username must be at least 2 characters." }, { status: 400 });
      }
      updateData.username = username;
    }

    if (body.goal !== undefined) {
      const validGoals = ["shred", "define", "strength", "athletic"];
      if (!validGoals.includes(body.goal)) {
        return NextResponse.json({ error: "Invalid goal specified." }, { status: 400 });
      }
      updateData.goal = body.goal;
    }

    if (body.level !== undefined) {
      const validLevels = ["beginner", "intermediate", "advanced"];
      if (!validLevels.includes(body.level)) {
        return NextResponse.json({ error: "Invalid level specified." }, { status: 400 });
      }
      updateData.level = body.level;
    }

    // Password change support
    if (body.newPassword) {
      const currentPassword = String(body.currentPassword ?? "");
      const newPassword = String(body.newPassword ?? "");

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
      }

      const [userRecord] = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);

      if (!userRecord || !verifyPassword(currentPassword, userRecord.passwordHash)) {
        return NextResponse.json({ error: "Current password does not match." }, { status: 403 });
      }

      updateData.passwordHash = hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields provided to update." }, { status: 400 });
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, sessionUser.id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        goal: users.goal,
        level: users.level,
        membershipTier: users.membershipTier,
        membershipExpiresAt: users.membershipExpiresAt,
      });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}

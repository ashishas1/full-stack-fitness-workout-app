import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, workoutSessions, payments, adminAuditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      membershipTier: users.membershipTier,
      membershipExpiresAt: users.membershipExpiresAt,
      onboardingCompleted: users.onboardingCompleted,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const [workoutsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSessions)
    .where(eq(workoutSessions.status, "completed"));

  const [totalVolume] = await db
    .select({ total: sql<string>`coalesce(sum(total_volume_kg), 0)::text` })
    .from(workoutSessions)
    .where(eq(workoutSessions.status, "completed"));

  const [totalRevenue] = await db
    .select({ revenue: sql<number>`coalesce(sum(amount), 0)::int` })
    .from(payments)
    .where(eq(payments.status, "paid"));

  return NextResponse.json({
    users: allUsers,
    stats: {
      totalUsers: allUsers.length,
      totalWorkouts: workoutsCount?.count ?? 0,
      totalVolumeKg: Math.round(Number(totalVolume?.total ?? 0)),
      totalRevenueInr: totalRevenue?.revenue ?? 0,
      activePaidMembers: allUsers.filter((u) => u.membershipTier && u.membershipTier !== "free").length,
    },
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { targetUserId, role, membershipTier } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(targetUserId)))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  const auditDetails: Record<string, unknown> = {};

  if (role !== undefined) {
    updateData.role = role;
    auditDetails.oldRole = targetUser.role;
    auditDetails.newRole = role;
  }

  if (membershipTier !== undefined) {
    updateData.membershipTier = membershipTier;
    auditDetails.oldTier = targetUser.membershipTier;
    auditDetails.newTier = membershipTier;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, Number(targetUserId)))
    .returning();

  // Create audit log
  await db.insert(adminAuditLogs).values({
    adminId: user.id,
    adminEmail: user.email,
    action: role !== undefined ? "UPDATE_ROLE" : "UPDATE_MEMBERSHIP_TIER",
    targetType: "user",
    targetId: String(targetUserId),
    details: auditDetails,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      username: updated.username,
      role: updated.role,
      membershipTier: updated.membershipTier,
    },
  });
}

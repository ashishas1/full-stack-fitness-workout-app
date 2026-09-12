import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, workoutSessions, payments, adminAuditLogs, exercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    redirect("/dashboard");
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

  const allExercises = await db
    .select()
    .from(exercises)
    .orderBy(desc(exercises.createdAt));

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

  const auditLogs = await db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(40);

  return (
    <AdminDashboardClient
      initialUsers={allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        membershipTier: u.membershipTier,
        membershipExpiresAt: u.membershipExpiresAt ? u.membershipExpiresAt.toISOString() : null,
        onboardingCompleted: u.onboardingCompleted,
        createdAt: u.createdAt.toISOString(),
      }))}
      initialAuditLogs={auditLogs.map((l) => ({
        id: l.id,
        adminEmail: l.adminEmail || "admin@system",
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        details: l.details as Record<string, unknown> | null,
        createdAt: l.createdAt.toISOString(),
      }))}
      initialExercises={allExercises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        targetArea: e.targetArea,
        bodyPart: e.bodyPart,
        primaryMuscle: e.primaryMuscle,
        difficulty: e.difficulty,
        equipment: e.equipment,
        exerciseType: e.exerciseType,
        movementMedia: e.movementMedia,
        instructionalVideo: e.instructionalVideo,
        description: e.description,
        setupInstructions: e.setupInstructions,
        movementInstructions: e.movementInstructions,
        commonMistakes: e.commonMistakes as string[] | null,
        isCustom: e.isCustom,
        createdAt: e.createdAt.toISOString(),
      }))}
      stats={{
        totalUsers: allUsers.length,
        totalWorkouts: workoutsCount?.count ?? 0,
        totalVolumeKg: Math.round(Number(totalVolume?.total ?? 0)),
        totalRevenueInr: totalRevenue?.revenue ?? 0,
        activePaidMembers: allUsers.filter((u) => u.membershipTier && u.membershipTier !== "free").length,
      }}
    />
  );
}

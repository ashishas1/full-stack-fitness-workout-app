import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userAchievements, workoutSessions, personalRecords, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let unlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id));

  const unlockedKeys = new Set(unlocked.map((u) => u.achievementKey));

  // Current stats
  const [wCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, user.id), eq(workoutSessions.status, "completed")));

  const [vTotal] = await db
    .select({ total: sql<string>`coalesce(sum(total_volume_kg), 0)::text` })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, user.id), eq(workoutSessions.status, "completed")));

  const [prCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(personalRecords)
    .where(eq(personalRecords.userId, user.id));

  const totalWorkouts = wCount?.count || 0;
  const totalVolume = Math.round(Number(vTotal?.total || 0));
  const totalPrs = prCount?.count || 0;

  // Auto-unlock achievements if criteria already satisfied in database
  async function checkAndUnlock(key: string, title: string, description: string, icon: string, satisfied: boolean) {
    if (satisfied && !unlockedKeys.has(key)) {
      const [inserted] = await db.insert(userAchievements).values({
        userId: user!.id,
        achievementKey: key,
        title,
        description,
        icon,
      }).returning();
      await db.insert(notifications).values({
        userId: user!.id,
        type: "achievement_unlocked",
        title: `🏆 Badge Unlocked: ${title}!`,
        message: description,
        data: { achievementKey: key },
      });
      unlockedKeys.add(key);
      unlocked.push(inserted);
    }
  }

  await checkAndUnlock("first_workout", "First Blood", "Completed your first live workout session.", "flame", totalWorkouts >= 1);
  await checkAndUnlock("workouts_10", "Decathlete", "Completed 10 total workout sessions.", "award", totalWorkouts >= 10);
  await checkAndUnlock("workouts_25", "Iron Dedicated", "Completed 25 total workout sessions.", "crown", totalWorkouts >= 25);
  await checkAndUnlock("volume_10k", "10-Ton Club", "Lifted a cumulative 10,000 kg across workouts.", "dumbbell", totalVolume >= 10000);
  await checkAndUnlock("first_pr", "Record Breaker", "Smashed your first personal record.", "trophy", totalPrs >= 1);

  const enriched = ALL_ACHIEVEMENTS.map((ach) => {
    const isUnlocked = unlockedKeys.has(ach.key);
    let current = 0;
    if (ach.metric === "workouts") current = totalWorkouts;
    else if (ach.metric === "volume") current = totalVolume;
    else if (ach.metric === "prs") current = totalPrs;

    return {
      ...ach,
      isUnlocked,
      currentValue: current,
      unlockedAt: unlocked.find((u) => u.achievementKey === ach.key)?.unlockedAt || null,
    };
  });

  return NextResponse.json({ achievements: enriched });
}

import { redirect } from "next/navigation";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  progressLogs,
  workoutSessions,
  userGoals,
  personalRecords,
  userAchievements,
  notifications,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { dayKey } from "@/lib/utils";
import { ProgressClient } from "@/components/progress-client";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements-data";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const now = new Date();
  const since = new Date(now.getTime() - 98 * 86400000);

  const logs = await db
    .select()
    .from(progressLogs)
    .where(eq(progressLogs.userId, user.id))
    .orderBy(asc(progressLogs.date));

  const goals = await db
    .select()
    .from(userGoals)
    .where(eq(userGoals.userId, user.id))
    .orderBy(desc(userGoals.createdAt));

  const prs = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, user.id))
    .orderBy(desc(personalRecords.achievedAt));

  const sessions = await db
    .select({
      startedAt: workoutSessions.startedAt,
      durationSeconds: workoutSessions.durationSeconds,
      totalVolumeKg: workoutSessions.totalVolumeKg,
      status: workoutSessions.status,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.startedAt, since)
      )
    )
    .orderBy(asc(workoutSessions.startedAt));

  // build 98-day calendar (oldest -> newest, weeks aligned Mon)
  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.startedAt));
    minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + Math.round(s.durationSeconds / 60));
  }
  const days: { date: string; minutes: number }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 97);
  // align to Monday
  while ((cursor.getDay() + 6) % 7 !== 0) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 112; i++) {
    const k = dayKey(cursor);
    days.push({ date: k, minutes: minutesByDay.get(k) ?? 0 });
    if (k === dayKey(new Date())) break;
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalCompleted = await db
    .select({
      startedAt: workoutSessions.startedAt,
      totalVolumeKg: workoutSessions.totalVolumeKg,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(workoutSessions.status, "completed")
      )
    );

  const totalVolumeKg = totalCompleted.reduce(
    (acc, row) => acc + (Number(row.totalVolumeKg) || 0),
    0
  );

  // Achievements
  let unlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id));

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementKey, u.unlockedAt]));

  // Auto-unlock achievements if criteria already satisfied in database
  async function checkAndUnlock(key: string, title: string, description: string, icon: string, satisfied: boolean) {
    if (satisfied && !unlockedMap.has(key)) {
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
      unlockedMap.set(key, inserted.unlockedAt);
    }
  }

  await checkAndUnlock("first_workout", "First Blood", "Completed your first live workout session.", "flame", totalCompleted.length >= 1);
  await checkAndUnlock("workouts_10", "Decathlete", "Completed 10 total workout sessions.", "award", totalCompleted.length >= 10);
  await checkAndUnlock("workouts_25", "Iron Dedicated", "Completed 25 total workout sessions.", "crown", totalCompleted.length >= 25);
  await checkAndUnlock("volume_10k", "10-Ton Club", "Lifted a cumulative 10,000 kg across workouts.", "dumbbell", totalVolumeKg >= 10000);
  await checkAndUnlock("first_pr", "Record Breaker", "Smashed your first personal record.", "trophy", prs.length >= 1);

  const enrichedAchievements = ALL_ACHIEVEMENTS.map((ach) => {
    const isUnlocked = unlockedMap.has(ach.key);
    let current = 0;
    if (ach.metric === "workouts") current = totalCompleted.length;
    else if (ach.metric === "volume") current = Math.round(totalVolumeKg);
    else if (ach.metric === "prs") current = prs.length;

    return {
      key: ach.key,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      target: ach.target,
      metric: ach.metric,
      isUnlocked,
      currentValue: current,
      unlockedAt: unlockedMap.get(ach.key)?.toISOString() || null,
    };
  });

  return (
    <ProgressClient
      initialLogs={logs.map((l) => ({
        id: l.id,
        date: new Date(l.date).toISOString(),
        weightKg: l.weightKg ? Number(l.weightKg) : null,
        waistCm: l.waistCm ? Number(l.waistCm) : null,
        chestCm: l.chestCm ? Number(l.chestCm) : null,
        armsCm: l.armsCm ? Number(l.armsCm) : null,
        thighsCm: l.thighsCm ? Number(l.thighsCm) : null,
        bodyFatPct: l.bodyFatPct ? Number(l.bodyFatPct) : null,
        note: l.note,
      }))}
      initialGoals={goals.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        targetValue: Number(g.targetValue),
        currentValue: Number(g.currentValue),
        unit: g.unit,
        deadline: g.deadline ? g.deadline.toISOString() : null,
        status: g.status,
      }))}
      personalRecords={prs.map((p) => ({
        id: p.id,
        exerciseId: p.exerciseId,
        exerciseName: p.exerciseName,
        recordType: p.recordType,
        value: Number(p.value),
        weightKg: p.weightKg ? Number(p.weightKg) : null,
        reps: p.reps,
        achievedAt: p.achievedAt.toISOString(),
      }))}
      achievements={enrichedAchievements}
      calendarDays={days}
      totalWorkouts={totalCompleted.length}
      totalVolumeKg={totalVolumeKg}
    />
  );
}

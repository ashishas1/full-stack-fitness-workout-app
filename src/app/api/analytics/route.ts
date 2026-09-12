import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, progressLogs, sessionLogs, workoutSessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { dayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const ninetyEightDaysAgo = new Date(now.getTime() - 98 * 86400000);

  // 1. All completed sessions
  const completedSessions = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      durationSeconds: workoutSessions.durationSeconds,
      planName: workoutSessions.planName,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(workoutSessions.status, "completed")
      )
    )
    .orderBy(desc(workoutSessions.startedAt));

  // 2. Training minutes by day
  const minutesByDay = new Map<string, number>();
  let totalSeconds = 0;
  for (const s of completedSessions) {
    totalSeconds += s.durationSeconds;
    const k = dayKey(new Date(s.startedAt));
    minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + Math.round(s.durationSeconds / 60));
  }

  // 3. Streak calculation
  let currentStreak = 0;
  let checkDate = new Date();
  while (true) {
    const key = dayKey(checkDate);
    if (minutesByDay.has(key) && (minutesByDay.get(key) ?? 0) > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today has no workout yet, check if yesterday was trained
      if (currentStreak === 0 && dayKey(checkDate) === dayKey(new Date())) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yKey = dayKey(checkDate);
        if (minutesByDay.has(yKey) && (minutesByDay.get(yKey) ?? 0) > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  // 4. Target area volume distribution
  const areaDistribution = await db
    .select({
      targetArea: exercises.targetArea,
      totalSets: sql<number>`sum(${sessionLogs.sets})`.mapWith(Number),
      count: sql<number>`count(${sessionLogs.id})`.mapWith(Number),
    })
    .from(sessionLogs)
    .innerJoin(workoutSessions, eq(workoutSessions.id, sessionLogs.sessionId))
    .innerJoin(exercises, eq(exercises.id, sessionLogs.exerciseId))
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(workoutSessions.status, "completed")
      )
    )
    .groupBy(exercises.targetArea);

  // 5. Estimated calories burned (approx 8.5 kcal per training minute)
  const totalMinutes = Math.round(totalSeconds / 60);
  const estimatedCaloriesBurned = Math.round(totalMinutes * 8.5);

  return NextResponse.json({
    metrics: {
      totalWorkouts: completedSessions.length,
      totalMinutesTrained: totalMinutes,
      totalHoursTrained: (totalMinutes / 60).toFixed(1),
      estimatedCaloriesBurned,
      currentStreakDays: currentStreak,
      activeDaysLast14Weeks: minutesByDay.size,
    },
    targetAreaDistribution: areaDistribution,
    recentSessions: completedSessions.slice(0, 10),
  });
}

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  sessionLogs,
  workoutSessions,
  exerciseSets,
  personalRecords,
  notifications,
  userGoals,
  userAchievements,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

async function owned(id: number, userId: number) {
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const session = await owned(Number(id), user.id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs = await db
    .select()
    .from(sessionLogs)
    .where(eq(sessionLogs.sessionId, session.id));

  const sets = await db
    .select()
    .from(exerciseSets)
    .where(eq(exerciseSets.sessionId, session.id))
    .orderBy(exerciseSets.setNumber);

  return NextResponse.json({ session, logs, sets });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const session = await owned(Number(id), user.id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  const action = b.action as string;

  if (action === "complete" || action === "abandon") {
    const durationSeconds = Math.max(0, Number(b.durationSeconds) || 0);

    if (action === "abandon") {
      const [row] = await db
        .update(workoutSessions)
        .set({
          status: "abandoned",
          endedAt: new Date(),
          durationSeconds,
          notes: String(b.notes ?? session.notes ?? ""),
        })
        .where(eq(workoutSessions.id, session.id))
        .returning();
      return NextResponse.json({ session: row });
    }

    // Process sets and calculate volume
    const detailedSets: Array<{
      exerciseId: number | null;
      exerciseName: string;
      setNumber: number;
      weightKg: number;
      reps: number;
      rpe: number;
    }> = [];

    if (Array.isArray(b.detailedSets) && b.detailedSets.length > 0) {
      for (let i = 0; i < b.detailedSets.length; i++) {
        const item = b.detailedSets[i];
        detailedSets.push({
          exerciseId: item.exerciseId ? Number(item.exerciseId) : null,
          exerciseName: String(item.exerciseName ?? "Exercise").slice(0, 120),
          setNumber: i + 1,
          weightKg: Math.max(0, Number(item.weightKg) || 0),
          reps: Math.max(0, Number(item.reps) || 0),
          rpe: Number(item.rpe) || 8.0,
        });
      }
    } else if (Array.isArray(b.logs)) {
      // Fallback from simplified logs if detailedSets not passed
      let setCounter = 1;
      for (const l of b.logs) {
        const setsCount = Math.max(1, Number(l.sets) || 1);
        const parsedReps = parseInt(String(l.reps ?? "10"), 10) || 10;
        for (let s = 0; s < setsCount; s++) {
          detailedSets.push({
            exerciseId: l.exerciseId ? Number(l.exerciseId) : null,
            exerciseName: String(l.exerciseName ?? "Exercise").slice(0, 120),
            setNumber: setCounter++,
            weightKg: 0,
            reps: parsedReps,
            rpe: 8.0,
          });
        }
      }
    }

    let totalVolume = 0;
    const setsToInsert = detailedSets.map((s) => {
      const vol = s.weightKg * s.reps;
      totalVolume += vol;
      return {
        sessionId: session.id,
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName,
        setNumber: s.setNumber,
        weightKg: String(s.weightKg),
        reps: s.reps,
        rpe: String(s.rpe),
        isWarmup: false,
        isCompleted: true,
      };
    });

    if (setsToInsert.length > 0) {
      await db.insert(exerciseSets).values(setsToInsert);
    }

    // Insert traditional sessionLogs for backward compatibility
    if (Array.isArray(b.logs) && b.logs.length > 0) {
      const values = b.logs
        .slice(0, 60)
        .map((l: Record<string, unknown>) => ({
          sessionId: session.id,
          exerciseId: l.exerciseId ? Number(l.exerciseId) : null,
          exerciseName: String(l.exerciseName ?? "Exercise").slice(0, 120),
          sets: Math.max(0, Number(l.sets) || 0),
          reps: String(l.reps ?? "").slice(0, 40),
        }))
        .filter((l: { sets: number }) => l.sets > 0);
      if (values.length > 0) await db.insert(sessionLogs).values(values);
    }

    // Calculate PRs using Epley Formula: 1RM = Weight * (1 + Reps / 30)
    const newPrsAchieved: Array<{
      exerciseName: string;
      recordType: string;
      value: number;
      unit: string;
    }> = [];

    for (const s of detailedSets) {
      if (s.weightKg > 0 && s.reps > 0 && s.exerciseId) {
        const estimated1Rm =
          s.reps === 1
            ? s.weightKg
            : Number((s.weightKg * (1 + s.reps / 30)).toFixed(1));

        // Check 1RM PR
        const existing1Rm = await db
          .select()
          .from(personalRecords)
          .where(
            and(
              eq(personalRecords.userId, user.id),
              eq(personalRecords.exerciseId, s.exerciseId),
              eq(personalRecords.recordType, "estimated_1rm")
            )
          )
          .orderBy(desc(personalRecords.value))
          .limit(1);

        const current1Rm = existing1Rm[0] ? Number(existing1Rm[0].value) : 0;
        if (estimated1Rm > current1Rm) {
          await db.insert(personalRecords).values({
            userId: user.id,
            exerciseId: s.exerciseId,
            exerciseName: s.exerciseName,
            recordType: "estimated_1rm",
            value: String(estimated1Rm),
            weightKg: String(s.weightKg),
            reps: s.reps,
            sessionId: session.id,
          });

          await db.insert(notifications).values({
            userId: user.id,
            type: "pr_achieved",
            title: `🔥 New PR: ${s.exerciseName}`,
            message: `You achieved an estimated 1RM of ${estimated1Rm} kg (${s.weightKg} kg × ${s.reps} reps)!`,
            data: {
              exerciseId: s.exerciseId,
              recordType: "estimated_1rm",
              value: estimated1Rm,
            },
          });

          newPrsAchieved.push({
            exerciseName: s.exerciseName,
            recordType: "Estimated 1RM",
            value: estimated1Rm,
            unit: "kg",
          });
        }

        // Check Heaviest Weight PR
        const existingWeight = await db
          .select()
          .from(personalRecords)
          .where(
            and(
              eq(personalRecords.userId, user.id),
              eq(personalRecords.exerciseId, s.exerciseId),
              eq(personalRecords.recordType, "heaviest_weight")
            )
          )
          .orderBy(desc(personalRecords.value))
          .limit(1);

        const currentWeight = existingWeight[0] ? Number(existingWeight[0].value) : 0;
        if (s.weightKg > currentWeight) {
          await db.insert(personalRecords).values({
            userId: user.id,
            exerciseId: s.exerciseId,
            exerciseName: s.exerciseName,
            recordType: "heaviest_weight",
            value: String(s.weightKg),
            weightKg: String(s.weightKg),
            reps: s.reps,
            sessionId: session.id,
          });

          newPrsAchieved.push({
            exerciseName: s.exerciseName,
            recordType: "Max Load",
            value: s.weightKg,
            unit: "kg",
          });
        }
      }
    }

    const caloriesBurned = Math.max(1, Math.round((durationSeconds / 60) * 8.5));

    // Update workout session record
    const [row] = await db
      .update(workoutSessions)
      .set({
        status: "completed",
        endedAt: new Date(),
        durationSeconds,
        totalVolumeKg: totalVolume.toFixed(2),
        completedSetsCount: detailedSets.length,
        caloriesBurned,
        notes: String(b.notes ?? session.notes ?? ""),
      })
      .where(eq(workoutSessions.id, session.id))
      .returning();

    // Create completed workout notification
    await db.insert(notifications).values({
      userId: user.id,
      type: "workout_completed",
      title: `Workout Finished: ${session.planName}`,
      message: `You completed ${detailedSets.length} sets with ${Math.round(totalVolume)} kg total volume in ${Math.round(durationSeconds / 60)} minutes!`,
      data: {
        sessionId: session.id,
        durationSeconds,
        totalVolumeKg: totalVolume,
        setsCount: detailedSets.length,
      },
    });

    // Evaluate Achievements
    const newAchievementsUnlocked: Array<{ title: string; icon: string }> = [];

    const [allCompletedWorkouts] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, user.id), eq(workoutSessions.status, "completed")));

    const totalSessions = allCompletedWorkouts?.count || 1;

    const [allVolumeRes] = await db
      .select({ total: sql<string>`coalesce(sum(total_volume_kg), 0)::text` })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, user.id), eq(workoutSessions.status, "completed")));
    const allVolume = Math.round(Number(allVolumeRes?.total || 0));

    const existingAchs = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, user.id));
    const existingKeys = new Set(existingAchs.map((a) => a.achievementKey));

    const currentUserId = user.id;
    async function tryUnlock(key: string, title: string, description: string, icon: string) {
      if (!existingKeys.has(key)) {
        await db.insert(userAchievements).values({
          userId: currentUserId,
          achievementKey: key,
          title,
          description,
          icon,
        });
        await db.insert(notifications).values({
          userId: currentUserId,
          type: "achievement_unlocked",
          title: `🏆 Badge Unlocked: ${title}!`,
          message: description,
          data: { achievementKey: key },
        });
        newAchievementsUnlocked.push({ title, icon });
        existingKeys.add(key);
      }
    }

    if (totalSessions >= 1) {
      await tryUnlock("first_workout", "First Blood", "Completed your first live workout session.", "flame");
    }
    if (totalSessions >= 10) {
      await tryUnlock("workouts_10", "Decathlete", "Completed 10 total workout sessions.", "award");
    }
    if (totalSessions >= 25) {
      await tryUnlock("workouts_25", "Iron Dedicated", "Completed 25 total workout sessions.", "crown");
    }
    if (allVolume >= 10000) {
      await tryUnlock("volume_10k", "10-Ton Club", "Lifted a cumulative 10,000 kg across workouts.", "dumbbell");
    }
    if (newPrsAchieved.length > 0) {
      await tryUnlock("first_pr", "Record Breaker", "Smashed your first personal record.", "trophy");
    }

    return NextResponse.json({
      session: row,
      newPrs: newPrsAchieved,
      newAchievements: newAchievementsUnlocked,
      totalVolumeKg: totalVolume.toFixed(2),
      caloriesBurned,
    });
  }

  if (action === "note") {
    const [row] = await db
      .update(workoutSessions)
      .set({ notes: String(b.notes ?? "") })
      .where(eq(workoutSessions.id, session.id))
      .returning();
    return NextResponse.json({ session: row });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const session = await owned(Number(id), user.id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.delete(workoutSessions).where(eq(workoutSessions.id, session.id));
  return NextResponse.json({ ok: true });
}

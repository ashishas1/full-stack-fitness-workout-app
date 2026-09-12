import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, personalRecords, exerciseSets, workoutSessions, sessionLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ExerciseDetailClient } from "@/components/exercise-detail-client";

export const dynamic = "force-dynamic";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const exerciseId = Number(id);
  if (isNaN(exerciseId)) redirect("/dashboard/exercises");

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!exercise) redirect("/dashboard/exercises");

  // User's PR on this exercise
  const userPrs = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, user.id),
        eq(personalRecords.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(personalRecords.value));

  // User's historical sets / session logs for this exercise
  const historyLogs = await db
    .select({
      id: sessionLogs.id,
      sets: sessionLogs.sets,
      reps: sessionLogs.reps,
      startedAt: workoutSessions.startedAt,
      planName: workoutSessions.planName,
    })
    .from(sessionLogs)
    .innerJoin(workoutSessions, eq(workoutSessions.id, sessionLogs.sessionId))
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(sessionLogs.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(8);

  return (
    <ExerciseDetailClient
      exercise={exercise}
      personalRecords={userPrs.map((pr) => ({
        id: pr.id,
        recordType: pr.recordType,
        value: pr.value,
        unit: pr.recordType === "max_reps" ? "reps" : "kg",
        achievedAt: pr.achievedAt,
        notes: pr.reps && pr.weightKg ? `${pr.weightKg} kg × ${pr.reps} reps` : null,
      }))}
      history={historyLogs.map((h) => ({
        id: h.id,
        sets: h.sets,
        reps: h.reps,
        startedAt: h.startedAt.toISOString(),
        planName: h.planName,
      }))}
    />
  );
}

import { redirect } from "next/navigation";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises, planExercises, workoutSessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { WorkoutPlayer, type PlayerExercise } from "@/components/workout-player";

export const dynamic = "force-dynamic";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const sessionId = Number(id);

  const rows = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, user.id)
      )
    )
    .limit(1);
  const session = rows[0];
  if (!session || session.status !== "active") redirect("/dashboard/train");

  let planItems: PlayerExercise[] = [];
  if (session.planId) {
    const joined = await db
      .select({
        exerciseId: exercises.id,
        name: exercises.name,
        targetArea: exercises.targetArea,
        accent: exercises.accent,
        icon: exercises.icon,
        steps: exercises.steps,
        sets: planExercises.sets,
        reps: planExercises.reps,
        durationSeconds: planExercises.durationSeconds,
        restSeconds: planExercises.restSeconds,
      })
      .from(planExercises)
      .innerJoin(exercises, eq(exercises.id, planExercises.exerciseId))
      .where(eq(planExercises.planId, session.planId))
      .orderBy(asc(planExercises.orderIndex));
    planItems = joined;
  }

  const library =
    planItems.length === 0
      ? await db
          .select()
          .from(exercises)
          .where(or(isNull(exercises.userId), eq(exercises.userId, user.id)))
          .orderBy(asc(exercises.name))
      : [];

  return (
    <WorkoutPlayer
      sessionId={session.id}
      planName={session.planName}
      items={planItems}
      library={library.map((e) => ({
        exerciseId: e.id,
        name: e.name,
        targetArea: e.targetArea,
        accent: e.accent,
        icon: e.icon,
        steps: e.steps,
        sets: e.sets,
        reps: e.reps,
        durationSeconds: e.durationSeconds,
        restSeconds: e.restSeconds,
      }))}
    />
  );
}

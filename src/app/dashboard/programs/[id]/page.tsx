import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  workoutPrograms,
  programWeeks,
  programDays,
  programDayExercises,
  exercises,
  programEnrollments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ProgramDetailClient } from "@/components/program-detail-client";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const programId = Number(id);
  if (isNaN(programId)) notFound();

  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(eq(workoutPrograms.id, programId))
    .limit(1);

  if (!program) notFound();

  const weeks = await db
    .select()
    .from(programWeeks)
    .where(eq(programWeeks.programId, programId))
    .orderBy(asc(programWeeks.weekNumber));

  const weeksWithDays = [];
  for (const w of weeks) {
    const days = await db
      .select()
      .from(programDays)
      .where(eq(programDays.weekId, w.id))
      .orderBy(asc(programDays.dayNumber));

    const daysData = [];
    for (const d of days) {
      const dayExs = await db
        .select({
          id: programDayExercises.id,
          orderIndex: programDayExercises.orderIndex,
          sets: programDayExercises.sets,
          reps: programDayExercises.reps,
          restSeconds: programDayExercises.restSeconds,
          exercise: exercises,
        })
        .from(programDayExercises)
        .innerJoin(exercises, eq(exercises.id, programDayExercises.exerciseId))
        .where(eq(programDayExercises.dayId, d.id))
        .orderBy(asc(programDayExercises.orderIndex));

      daysData.push({
        id: d.id,
        dayNumber: d.dayNumber,
        name: d.name,
        focus: d.focus,
        isRestDay: d.isRestDay,
        exercises: dayExs,
      });
    }

    weeksWithDays.push({
      id: w.id,
      weekNumber: w.weekNumber,
      title: w.title,
      description: w.description,
      days: daysData,
    });
  }

  const [enrollment] = await db
    .select()
    .from(programEnrollments)
    .where(
      and(
        eq(programEnrollments.userId, user.id),
        eq(programEnrollments.programId, programId)
      )
    )
    .limit(1);

  return (
    <ProgramDetailClient
      program={program}
      weeks={weeksWithDays}
      initialEnrollment={enrollment || null}
    />
  );
}

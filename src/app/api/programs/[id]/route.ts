import { NextResponse } from "next/server";
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

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const programId = Number(id);

  if (isNaN(programId)) {
    return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
  }

  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(eq(workoutPrograms.id, programId))
    .limit(1);

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Weeks
  const weeks = await db
    .select()
    .from(programWeeks)
    .where(eq(programWeeks.programId, programId))
    .orderBy(asc(programWeeks.weekNumber));

  // Days
  const daysWithExercises = [];
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
        ...d,
        exercises: dayExs,
      });
    }

    daysWithExercises.push({
      ...w,
      days: daysData,
    });
  }

  let enrollment = null;
  if (user) {
    const [e] = await db
      .select()
      .from(programEnrollments)
      .where(
        and(
          eq(programEnrollments.userId, user.id),
          eq(programEnrollments.programId, programId)
        )
      )
      .limit(1);
    enrollment = e || null;
  }

  return NextResponse.json({
    program,
    weeks: daysWithExercises,
    enrollment,
  });
}

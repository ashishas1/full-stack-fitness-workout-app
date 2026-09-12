import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { programEnrollments, workoutPrograms, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const programId = Number(id);
  if (isNaN(programId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const nextWeek = Number(body.currentWeek);
  const nextDay = Number(body.currentDay);

  const [existing] = await db
    .select()
    .from(programEnrollments)
    .where(
      and(
        eq(programEnrollments.userId, user.id),
        eq(programEnrollments.programId, programId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not enrolled in this program" }, { status: 404 });
  }

  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(eq(workoutPrograms.id, programId))
    .limit(1);

  const isCompleted =
    nextWeek > (program?.durationWeeks || 4);

  const [updated] = await db
    .update(programEnrollments)
    .set({
      currentWeek: nextWeek || existing.currentWeek,
      currentDay: nextDay || existing.currentDay,
      status: isCompleted ? "completed" : "active",
      completedAt: isCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(programEnrollments.id, existing.id))
    .returning();

  if (isCompleted) {
    await db.insert(notifications).values({
      userId: user.id,
      type: "program_update",
      title: `🏆 Program Completed: ${program?.title}!`,
      message: `Spectacular achievement! You finished all ${program?.durationWeeks} weeks of ${program?.title}.`,
      data: { programId },
    });
  }

  return NextResponse.json({ ok: true, enrollment: updated });
}

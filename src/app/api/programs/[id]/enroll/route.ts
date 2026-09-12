import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPrograms, programEnrollments, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const programId = Number(id);
  if (isNaN(programId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(eq(workoutPrograms.id, programId))
    .limit(1);

  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

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

  let enrollmentRecord;
  if (existing) {
    const [updated] = await db
      .update(programEnrollments)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(programEnrollments.id, existing.id))
      .returning();
    enrollmentRecord = updated;
  } else {
    const [created] = await db
      .insert(programEnrollments)
      .values({
        userId: user.id,
        programId,
        currentWeek: 1,
        currentDay: 1,
        status: "active",
      })
      .returning();
    enrollmentRecord = created;
  }

  await db.insert(notifications).values({
    userId: user.id,
    type: "program_update",
    title: `Enrolled: ${program.title}`,
    message: `You have committed to the ${program.durationWeeks}-week ${program.title}! Check your daily schedule to start Week 1 Day 1.`,
    data: { programId: program.id },
  });

  return NextResponse.json({ ok: true, enrollment: enrollmentRecord });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const programId = Number(id);
  if (isNaN(programId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await db
    .update(programEnrollments)
    .set({ status: "dropped", updatedAt: new Date() })
    .where(
      and(
        eq(programEnrollments.userId, user.id),
        eq(programEnrollments.programId, programId)
      )
    );

  return NextResponse.json({ ok: true, unrolled: true });
}

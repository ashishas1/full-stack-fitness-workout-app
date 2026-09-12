import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPrograms, programEnrollments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const programs = await db
    .select()
    .from(workoutPrograms)
    .orderBy(desc(workoutPrograms.createdAt));

  let enrollmentsMap = new Map();
  if (user) {
    const userEnrollments = await db
      .select()
      .from(programEnrollments)
      .where(eq(programEnrollments.userId, user.id));

    for (const e of userEnrollments) {
      enrollmentsMap.set(e.programId, e);
    }
  }

  const enriched = programs.map((p) => {
    const enrollment = enrollmentsMap.get(p.id);
    return {
      ...p,
      isEnrolled: !!enrollment && enrollment.status === "active",
      enrollment: enrollment || null,
    };
  });

  return NextResponse.json({ programs: enriched });
}

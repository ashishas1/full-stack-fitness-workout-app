import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPrograms, programEnrollments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ProgramsClient } from "@/components/programs-client";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const programs = await db
    .select()
    .from(workoutPrograms)
    .orderBy(desc(workoutPrograms.createdAt));

  const enrollments = await db
    .select()
    .from(programEnrollments)
    .where(eq(programEnrollments.userId, user.id));

  const enrollmentsMap = new Map();
  for (const e of enrollments) {
    enrollmentsMap.set(e.programId, e);
  }

  return (
    <ProgramsClient
      programs={programs.map((p) => {
        const e = enrollmentsMap.get(p.id);
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          level: p.level,
          durationWeeks: p.durationWeeks,
          daysPerWeek: p.daysPerWeek,
          category: p.category,
          isEnrolled: !!e && e.status === "active",
          currentWeek: e ? e.currentWeek : 1,
          currentDay: e ? e.currentDay : 1,
          status: e ? e.status : null,
        };
      })}
    />
  );
}

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { planExercises, plans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PlansClient } from "@/components/plans-client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, user.id));

  const items = await db
    .select({
      planId: planExercises.planId,
      sets: planExercises.sets,
      restSeconds: planExercises.restSeconds,
      durationSeconds: planExercises.durationSeconds,
    })
    .from(planExercises)
    .innerJoin(plans, eq(plans.id, planExercises.planId))
    .where(eq(plans.userId, user.id));

  const summary = new Map<number, { count: number; seconds: number }>();
  for (const it of items) {
    const cur = summary.get(it.planId) ?? { count: 0, seconds: 0 };
    cur.count++;
    cur.seconds += it.sets * ((it.durationSeconds ?? 40) + it.restSeconds);
    summary.set(it.planId, cur);
  }

  return (
    <PlansClient
      initial={rows
        .map((p) => ({
          ...p,
          exerciseCount: summary.get(p.id)?.count ?? 0,
          estMinutes: Math.max(1, Math.round((summary.get(p.id)?.seconds ?? 0) / 60)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))}
    />
  );
}

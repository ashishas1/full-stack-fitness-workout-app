import { notFound, redirect } from "next/navigation";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises, planExercises, plans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PlanEditor, type PlanItem } from "@/components/plan-editor";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const planId = Number(id);

  const planRows = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
    .limit(1);
  const plan = planRows[0];
  if (!plan) notFound();

  const items: PlanItem[] = await db
    .select({
      id: planExercises.id,
      planId: planExercises.planId,
      exerciseId: planExercises.exerciseId,
      orderIndex: planExercises.orderIndex,
      sets: planExercises.sets,
      reps: planExercises.reps,
      restSeconds: planExercises.restSeconds,
      durationSeconds: planExercises.durationSeconds,
      exercise: exercises,
    })
    .from(planExercises)
    .innerJoin(exercises, eq(exercises.id, planExercises.exerciseId))
    .where(eq(planExercises.planId, plan.id))
    .orderBy(asc(planExercises.orderIndex));

  const library = await db
    .select()
    .from(exercises)
    .where(or(isNull(exercises.userId), eq(exercises.userId, user.id)))
    .orderBy(asc(exercises.name));

  return <PlanEditor plan={plan} initialItems={items} library={library} />;
}

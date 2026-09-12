import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, planExercises, plans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ownedPlan(id: number, userId: number) {
  const rows = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, id), eq(plans.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await ownedPlan(Number(id), user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select({
      id: planExercises.id,
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

  return NextResponse.json({ plan, items });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await ownedPlan(Number(id), user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  const [row] = await db
    .update(plans)
    .set({
      name: String(b.name ?? plan.name).trim() || plan.name,
      description: String(b.description ?? plan.description),
      level: ["beginner", "intermediate", "advanced"].includes(b.level)
        ? b.level
        : plan.level,
      focus: String(b.focus ?? plan.focus),
    })
    .where(eq(plans.id, plan.id))
    .returning();
  return NextResponse.json({ plan: row });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await ownedPlan(Number(id), user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.delete(plans).where(eq(plans.id, plan.id));
  return NextResponse.json({ ok: true });
}

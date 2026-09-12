import { NextResponse } from "next/server";
import { and, eq, max } from "drizzle-orm";
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await ownedPlan(Number(id), user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  const exerciseId = Number(b.exerciseId);
  const exRows = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);
  const ex = exRows[0];
  if (!ex) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const dup = await db
    .select({ id: planExercises.id })
    .from(planExercises)
    .where(
      and(
        eq(planExercises.planId, plan.id),
        eq(planExercises.exerciseId, exerciseId)
      )
    )
    .limit(1);
  if (dup.length > 0)
    return NextResponse.json({ error: "Already in this plan." }, { status: 409 });

  const [top] = await db
    .select({ m: max(planExercises.orderIndex) })
    .from(planExercises)
    .where(eq(planExercises.planId, plan.id));

  const [row] = await db
    .insert(planExercises)
    .values({
      planId: plan.id,
      exerciseId,
      orderIndex: (top?.m ?? -1) + 1,
      sets: Math.min(10, Math.max(1, Number(b.sets) || ex.sets)),
      reps: String(b.reps ?? ex.reps),
      restSeconds: Math.min(300, Math.max(0, Number(b.restSeconds) || ex.restSeconds)),
      durationSeconds:
        b.durationSeconds !== undefined ? b.durationSeconds : ex.durationSeconds,
    })
    .returning();
  return NextResponse.json({ item: row, exercise: ex });
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
  const itemId = Number(b.planExerciseId);
  const updates: Record<string, unknown> = {};
  if (b.sets !== undefined)
    updates.sets = Math.min(10, Math.max(1, Number(b.sets) || 1));
  if (b.reps !== undefined) updates.reps = String(b.reps);
  if (b.restSeconds !== undefined)
    updates.restSeconds = Math.min(300, Math.max(0, Number(b.restSeconds) || 0));
  if (b.durationSeconds !== undefined)
    updates.durationSeconds = b.durationSeconds;
  if (b.orderIndex !== undefined) updates.orderIndex = Number(b.orderIndex);

  const [row] = await db
    .update(planExercises)
    .set(updates)
    .where(
      and(eq(planExercises.id, itemId), eq(planExercises.planId, plan.id))
    )
    .returning();
  if (!row) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ item: row });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await ownedPlan(Number(id), user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  await db
    .delete(planExercises)
    .where(
      and(
        eq(planExercises.id, Number(b.planExerciseId)),
        eq(planExercises.planId, plan.id)
      )
    );
  return NextResponse.json({ ok: true });
}

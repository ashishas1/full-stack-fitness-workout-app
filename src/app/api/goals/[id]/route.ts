import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userGoals, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goalId = Number(id);
  if (isNaN(goalId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const [existing] = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updateData: Record<string, unknown> = {};

  if (body.currentValue !== undefined) updateData.currentValue = String(body.currentValue);
  if (body.targetValue !== undefined) updateData.targetValue = String(body.targetValue);
  if (body.title !== undefined) updateData.title = String(body.title).slice(0, 150);
  if (body.status !== undefined) updateData.status = String(body.status);

  // Auto-mark completed if currentValue meets or exceeds target
  const finalCurrent = Number(updateData.currentValue ?? existing.currentValue);
  const finalTarget = Number(updateData.targetValue ?? existing.targetValue);
  if (finalCurrent >= finalTarget && existing.status !== "completed") {
    updateData.status = "completed";
    await db.insert(notifications).values({
      userId: user.id,
      type: "goal_completed",
      title: `🎯 Goal Achieved: ${existing.title}`,
      message: `Congratulations! You reached your target of ${finalTarget} ${existing.unit}!`,
      data: { goalId: existing.id },
    });
  }

  const [updated] = await db
    .update(userGoals)
    .set(updateData)
    .where(eq(userGoals.id, goalId))
    .returning();

  return NextResponse.json({ goal: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goalId = Number(id);
  if (isNaN(goalId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await db
    .delete(userGoals)
    .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, user.id)));

  return NextResponse.json({ ok: true });
}

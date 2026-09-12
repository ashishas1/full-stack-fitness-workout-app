import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AREA_ACCENT } from "@/lib/utils";

async function ownedCustom(id: number, userId: number) {
  const rows = await db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.id, id),
        eq(exercises.userId, userId),
        eq(exercises.isCustom, true)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ex = await ownedCustom(Number(id), user.id);
  if (!ex)
    return NextResponse.json(
      { error: "You can only edit your own custom exercises." },
      { status: 403 }
    );

  const b = await req.json();
  const targetArea = String(b.targetArea ?? ex.targetArea);
  const [row] = await db
    .update(exercises)
    .set({
      name: String(b.name ?? ex.name).trim() || ex.name,
      targetArea,
      difficulty: String(b.difficulty ?? ex.difficulty),
      equipment: String(b.equipment ?? ex.equipment),
      description: String(b.description ?? ex.description),
      steps: Array.isArray(b.steps)
        ? b.steps.map((s: unknown) => String(s).trim()).filter(Boolean)
        : ex.steps,
      tips: Array.isArray(b.tips)
        ? b.tips.map((s: unknown) => String(s).trim()).filter(Boolean)
        : ex.tips,
      sets: Math.min(10, Math.max(1, Number(b.sets) || ex.sets)),
      reps: String(b.reps ?? ex.reps),
      restSeconds: Math.min(300, Math.max(0, Number(b.restSeconds ?? ex.restSeconds))),
      durationSeconds:
        b.durationSeconds === null
          ? null
          : b.durationSeconds !== undefined
            ? Math.min(600, Math.max(5, Number(b.durationSeconds) || 0))
            : ex.durationSeconds,
      accent: AREA_ACCENT[targetArea] ?? ex.accent,
    })
    .where(eq(exercises.id, ex.id))
    .returning();
  return NextResponse.json({ exercise: row });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ex = await ownedCustom(Number(id), user.id);
  if (!ex)
    return NextResponse.json(
      { error: "You can only delete your own custom exercises." },
      { status: 403 }
    );
  await db.delete(exercises).where(eq(exercises.id, ex.id));
  return NextResponse.json({ ok: true });
}

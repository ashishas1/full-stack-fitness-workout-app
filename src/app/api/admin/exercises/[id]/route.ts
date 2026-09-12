import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, adminAuditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const exerciseId = Number(id);

  const existing = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const b = await req.json();

  const updateData: Record<string, unknown> = {};
  if (b.name !== undefined) updateData.name = String(b.name).trim();
  if (b.slug !== undefined) updateData.slug = String(b.slug).trim();
  if (b.targetArea !== undefined) updateData.targetArea = b.targetArea;
  if (b.bodyPart !== undefined) updateData.bodyPart = b.bodyPart;
  if (b.primaryMuscle !== undefined) updateData.primaryMuscle = b.primaryMuscle;
  if (b.secondaryMuscles !== undefined) updateData.secondaryMuscles = b.secondaryMuscles;
  if (b.difficulty !== undefined) updateData.difficulty = b.difficulty;
  if (b.equipment !== undefined) updateData.equipment = b.equipment;
  if (b.exerciseType !== undefined) updateData.exerciseType = b.exerciseType;
  if (b.movementPattern !== undefined) updateData.movementPattern = b.movementPattern;
  if (b.description !== undefined) updateData.description = String(b.description).trim();
  if (b.movementMedia !== undefined) updateData.movementMedia = b.movementMedia ? String(b.movementMedia).trim() : null;
  if (b.instructionalVideo !== undefined) updateData.instructionalVideo = b.instructionalVideo ? String(b.instructionalVideo).trim() : null;
  if (b.setupInstructions !== undefined) updateData.setupInstructions = b.setupInstructions ? String(b.setupInstructions).trim() : null;
  if (b.movementInstructions !== undefined) updateData.movementInstructions = b.movementInstructions ? String(b.movementInstructions).trim() : null;
  if (b.finishInstructions !== undefined) updateData.finishInstructions = b.finishInstructions ? String(b.finishInstructions).trim() : null;
  if (b.commonMistakes !== undefined) updateData.commonMistakes = b.commonMistakes;
  if (b.safety !== undefined) updateData.safety = b.safety;

  const [updated] = await db
    .update(exercises)
    .set(updateData)
    .where(eq(exercises.id, exerciseId))
    .returning();

  // Audit log
  await db.insert(adminAuditLogs).values({
    adminId: user.id,
    adminEmail: user.email,
    action: "update_exercise",
    targetType: "exercise",
    targetId: String(exerciseId),
    details: {
      updatedFields: Object.keys(updateData),
      name: updated.name,
    },
  });

  return NextResponse.json({ exercise: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const exerciseId = Number(id);

  const existing = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  await db.delete(exercises).where(eq(exercises.id, exerciseId));

  // Audit log
  await db.insert(adminAuditLogs).values({
    adminId: user.id,
    adminEmail: user.email,
    action: "delete_exercise",
    targetType: "exercise",
    targetId: String(exerciseId),
    details: {
      name: existing[0].name,
    },
  });

  return NextResponse.json({ ok: true });
}

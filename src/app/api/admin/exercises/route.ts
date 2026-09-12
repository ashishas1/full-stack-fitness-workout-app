import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, adminAuditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(exercises)
    .orderBy(desc(exercises.createdAt));

  return NextResponse.json({ exercises: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const b = await req.json();
  if (!b.name || typeof b.name !== "string" || !b.name.trim()) {
    return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
  }

  const slug = b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const [row] = await db
    .insert(exercises)
    .values({
      name: b.name.trim(),
      slug,
      targetArea: b.targetArea || "full",
      bodyPart: b.bodyPart || "full_body",
      primaryMuscle: b.primaryMuscle || b.bodyPart || "Full Body",
      secondaryMuscles: Array.isArray(b.secondaryMuscles) ? b.secondaryMuscles : [],
      difficulty: b.difficulty || "beginner",
      equipment: b.equipment || "none",
      exerciseType: b.exerciseType || "strength",
      movementPattern: b.movementPattern || "push",
      description: String(b.description ?? "").trim(),
      movementMedia: b.movementMedia ? String(b.movementMedia).trim() : null,
      instructionalVideo: b.instructionalVideo ? String(b.instructionalVideo).trim() : null,
      setupInstructions: b.setupInstructions ? String(b.setupInstructions).trim() : null,
      movementInstructions: b.movementInstructions ? String(b.movementInstructions).trim() : null,
      finishInstructions: b.finishInstructions ? String(b.finishInstructions).trim() : null,
      steps: Array.isArray(b.steps) ? b.steps : [],
      tips: Array.isArray(b.tips) ? b.tips : [],
      commonMistakes: Array.isArray(b.commonMistakes) ? b.commonMistakes : [],
      safety: b.safety ? String(b.safety).trim() : null,
      isCustom: false,
      userId: null,
    })
    .returning();

  // Record audit log
  await db.insert(adminAuditLogs).values({
    adminId: user.id,
    adminEmail: user.email,
    action: "create_exercise",
    targetType: "exercise",
    targetId: String(row.id),
    details: {
      name: row.name,
      bodyPart: row.bodyPart,
      difficulty: row.difficulty,
      equipment: row.equipment,
    },
  });

  return NextResponse.json({ exercise: row });
}

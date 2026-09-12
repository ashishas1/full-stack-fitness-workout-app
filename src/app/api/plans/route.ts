import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { planExercises, plans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  return NextResponse.json({
    plans: rows.map((p) => ({
      ...p,
      exerciseCount: summary.get(p.id)?.count ?? 0,
      estMinutes: Math.max(1, Math.round((summary.get(p.id)?.seconds ?? 0) / 60)),
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (name.length < 3)
    return NextResponse.json({ error: "Give your plan a name (3+ characters)." }, { status: 400 });

  const [plan] = await db
    .insert(plans)
    .values({
      userId: user.id,
      name,
      description: String(b.description ?? "").trim(),
      level: ["beginner", "intermediate", "advanced"].includes(b.level)
        ? b.level
        : "beginner",
      focus: String(b.focus ?? "custom"),
    })
    .returning();
  return NextResponse.json({ plan });
}

import { NextResponse } from "next/server";
import { eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AREA_ACCENT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(exercises)
    .where(or(isNull(exercises.userId), eq(exercises.userId, user.id)));
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ exercises: rows });
}

const VALID_AREA = new Set(["upper", "lower", "obliques", "full"]);
const VALID_DIFF = new Set(["beginner", "intermediate", "advanced"]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const name = String(b.name ?? "").trim();
  const targetArea = String(b.targetArea ?? "full");
  const difficulty = String(b.difficulty ?? "beginner");
  const equipment = String(b.equipment ?? "none");
  const description = String(b.description ?? "").trim();
  const steps: string[] = Array.isArray(b.steps)
    ? b.steps.map((s: unknown) => String(s).trim()).filter(Boolean)
    : [];
  const tips: string[] = Array.isArray(b.tips)
    ? b.tips.map((s: unknown) => String(s).trim()).filter(Boolean)
    : [];
  const reps = String(b.reps ?? "").trim();

  if (name.length < 3)
    return NextResponse.json({ error: "Name the exercise (3+ characters)." }, { status: 400 });
  if (!VALID_AREA.has(targetArea))
    return NextResponse.json({ error: "Pick a target area." }, { status: 400 });
  if (!VALID_DIFF.has(difficulty))
    return NextResponse.json({ error: "Pick a difficulty." }, { status: 400 });
  if (steps.length === 0)
    return NextResponse.json({ error: "Add at least one how-to step." }, { status: 400 });
  if (!reps)
    return NextResponse.json({ error: "Set a rep target (e.g. '12–15' or '30 sec')." }, { status: 400 });

  const sets = Math.min(10, Math.max(1, Number(b.sets) || 3));
  const restSeconds = Math.min(300, Math.max(0, Number(b.restSeconds) || 45));
  const durationSeconds =
    b.durationSeconds != null && b.durationSeconds !== ""
      ? Math.min(600, Math.max(5, Number(b.durationSeconds) || 0))
      : null;

  const [row] = await db
    .insert(exercises)
    .values({
      name,
      targetArea,
      difficulty,
      equipment,
      description,
      steps,
      tips,
      sets,
      reps,
      durationSeconds,
      restSeconds,
      kcalPerMin: Math.min(20, Math.max(1, Number(b.kcalPerMin) || 7)),
      accent: AREA_ACCENT[targetArea] ?? "volt",
      icon: "flame",
      isCustom: true,
      userId: user.id,
    })
    .returning();

  return NextResponse.json({ exercise: row });
}

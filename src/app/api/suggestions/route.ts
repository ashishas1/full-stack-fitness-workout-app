import { NextResponse } from "next/server";
import { eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { suggestExercises } from "@/lib/suggestions";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const goal = url.searchParams.get("goal") ?? user.goal ?? "shred";
  const level = url.searchParams.get("level") ?? user.level ?? "beginner";
  const setting = url.searchParams.get("setting") ?? "home";
  const count = Math.min(6, Math.max(1, Number(url.searchParams.get("count")) || 3));
  const exclude = (url.searchParams.get("exclude") ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);

  const all = await db
    .select()
    .from(exercises)
    .where(or(isNull(exercises.userId), eq(exercises.userId, user.id)));

  const ranked = suggestExercises(all, { goal, level, setting, excludeIds: exclude, count });
  return NextResponse.json({
    suggestions: ranked.map((r) => ({ exercise: r.item, reason: r.reason })),
  });
}

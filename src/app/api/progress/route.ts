import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { progressLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(progressLogs)
    .where(eq(progressLogs.userId, user.id))
    .orderBy(asc(progressLogs.date));
  return NextResponse.json({ logs: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();

  const weightKg =
    b.weightKg !== undefined && b.weightKg !== "" && b.weightKg !== null
      ? Number(b.weightKg)
      : null;
  const waistCm =
    b.waistCm !== undefined && b.waistCm !== "" && b.waistCm !== null
      ? Number(b.waistCm)
      : null;
  const chestCm =
    b.chestCm !== undefined && b.chestCm !== "" && b.chestCm !== null
      ? Number(b.chestCm)
      : null;
  const armsCm =
    b.armsCm !== undefined && b.armsCm !== "" && b.armsCm !== null
      ? Number(b.armsCm)
      : null;
  const thighsCm =
    b.thighsCm !== undefined && b.thighsCm !== "" && b.thighsCm !== null
      ? Number(b.thighsCm)
      : null;
  const bodyFatPct =
    b.bodyFatPct !== undefined && b.bodyFatPct !== "" && b.bodyFatPct !== null
      ? Number(b.bodyFatPct)
      : null;

  if (
    weightKg === null &&
    waistCm === null &&
    chestCm === null &&
    armsCm === null &&
    thighsCm === null &&
    bodyFatPct === null
  ) {
    return NextResponse.json(
      { error: "Please log at least one body measurement." },
      { status: 400 }
    );
  }

  const date = b.date ? new Date(String(b.date)) : new Date();
  const [row] = await db
    .insert(progressLogs)
    .values({
      userId: user.id,
      date: Number.isNaN(date.getTime()) ? new Date() : date,
      weightKg: weightKg === null ? null : String(weightKg),
      waistCm: waistCm === null ? null : String(waistCm),
      chestCm: chestCm === null ? null : String(chestCm),
      armsCm: armsCm === null ? null : String(armsCm),
      thighsCm: thighsCm === null ? null : String(thighsCm),
      bodyFatPct: bodyFatPct === null ? null : String(bodyFatPct),
      note: String(b.note ?? "").slice(0, 300),
    })
    .returning();
  return NextResponse.json({ log: row });
}

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { progressLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function owned(id: number, userId: number) {
  const rows = await db
    .select()
    .from(progressLogs)
    .where(and(eq(progressLogs.id, id), eq(progressLogs.userId, userId)))
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
  const log = await owned(Number(id), user.id);
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  const [row] = await db
    .update(progressLogs)
    .set({
      weightKg:
        b.weightKg !== undefined && b.weightKg !== ""
          ? String(Number(b.weightKg))
          : log.weightKg,
      waistCm:
        b.waistCm !== undefined && b.waistCm !== ""
          ? String(Number(b.waistCm))
          : log.waistCm,
      chestCm:
        b.chestCm !== undefined && b.chestCm !== ""
          ? String(Number(b.chestCm))
          : log.chestCm,
      armsCm:
        b.armsCm !== undefined && b.armsCm !== ""
          ? String(Number(b.armsCm))
          : log.armsCm,
      thighsCm:
        b.thighsCm !== undefined && b.thighsCm !== ""
          ? String(Number(b.thighsCm))
          : log.thighsCm,
      bodyFatPct:
        b.bodyFatPct !== undefined && b.bodyFatPct !== ""
          ? String(Number(b.bodyFatPct))
          : log.bodyFatPct,
      note: b.note !== undefined ? String(b.note).slice(0, 300) : log.note,
    })
    .where(eq(progressLogs.id, log.id))
    .returning();
  return NextResponse.json({ log: row });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const log = await owned(Number(id), user.id);
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.delete(progressLogs).where(eq(progressLogs.id, log.id));
  return NextResponse.json({ ok: true });
}

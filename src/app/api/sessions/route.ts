import { NextResponse } from "next/server";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { plans, sessionLogs, workoutSessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await abandonStale(user.id);

  const rows = await db
    .select({
      session: workoutSessions,
      logCount: sql<number>`count(${sessionLogs.id})`.mapWith(Number),
    })
    .from(workoutSessions)
    .leftJoin(sessionLogs, eq(sessionLogs.sessionId, workoutSessions.id))
    .where(eq(workoutSessions.userId, user.id))
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.startedAt))
    .limit(60);

  return NextResponse.json({
    sessions: rows.map((r) => ({ ...r.session, logCount: r.logCount })),
  });
}

async function abandonStale(userId: number) {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  await db
    .update(workoutSessions)
    .set({ status: "abandoned", endedAt: new Date() })
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "active"),
        lt(workoutSessions.startedAt, cutoff)
      )
    );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const planId = b.planId ? Number(b.planId) : null;

  let planName = "Free Session";
  if (planId) {
    const rows = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1);
    if (!rows[0])
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    planName = rows[0].name;
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({ userId: user.id, planId, planName, status: "active" })
    .returning();
  return NextResponse.json({ session });
}

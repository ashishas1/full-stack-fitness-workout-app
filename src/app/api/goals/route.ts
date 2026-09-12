import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { userGoals, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await db
    .select()
    .from(userGoals)
    .where(eq(userGoals.userId, user.id))
    .orderBy(desc(userGoals.createdAt));

  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, category, targetValue, currentValue, unit, deadline } = body;

  if (!title || !targetValue) {
    return NextResponse.json({ error: "Title and target value are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(userGoals)
    .values({
      userId: user.id,
      title: String(title).slice(0, 150),
      category: category || "strength",
      targetValue: String(targetValue),
      currentValue: String(currentValue || "0"),
      unit: unit || "kg",
      deadline: deadline ? new Date(deadline) : null,
      status: "in_progress",
    })
    .returning();

  return NextResponse.json({ goal: created }, { status: 201 });
}

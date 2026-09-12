import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications: items, unreadCount });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, markAllRead } = body;

  if (markAllRead) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
    return NextResponse.json({ ok: true, markedAll: true });
  }

  if (id) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, Number(id)), eq(notifications.userId, user.id)));
    return NextResponse.json({ ok: true, id });
  }

  return NextResponse.json({ error: "Missing id or markAllRead" }, { status: 400 });
}

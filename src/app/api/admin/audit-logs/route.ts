import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const logs = await db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(50);

  return NextResponse.json({ logs });
}

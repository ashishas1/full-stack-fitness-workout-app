import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { MembershipClient } from "@/components/membership-client";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const history = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt));

  return (
    <MembershipClient
      initialTier={user.membershipTier ?? "free"}
      initialExpiresAt={user.membershipExpiresAt}
      initialPayments={history}
      username={user.username}
    />
  );
}

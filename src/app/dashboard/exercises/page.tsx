import { redirect } from "next/navigation";
import { asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ExerciseLibrary } from "@/components/exercise-library";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await db
    .select()
    .from(exercises)
    .where(or(isNull(exercises.userId), eq(exercises.userId, user.id)))
    .orderBy(asc(exercises.name));
  return <ExerciseLibrary initial={rows} />;
}

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingClient } from "@/components/onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <OnboardingClient
      username={user.username}
      initialData={{
        name: row?.name || user.username,
        age: row?.age || 25,
        gender: row?.gender || "prefer_not_to_say",
        heightCm: row?.heightCm ? Number(row.heightCm) : 175,
        weightKg: row?.weightKg ? Number(row.weightKg) : 72,
        unitsPreference: (row?.unitsPreference as "metric" | "imperial") || "metric",
        primaryGoal: row?.primaryGoal || "build_muscle",
        secondaryGoals: (row?.secondaryGoals as string[]) || ["improve_strength"],
        currentBodyFat: row?.currentBodyFat ? Number(row.currentBodyFat) : 16,
        targetBodyFat: row?.targetBodyFat ? Number(row.targetBodyFat) : 12,
        targetWeight: row?.targetWeight ? Number(row.targetWeight) : 70,
        targetTimelineWeeks: row?.targetTimelineWeeks || 12,
        trainingDaysPerWeek: row?.trainingDaysPerWeek || 4,
        workoutDurationMinutes: row?.workoutDurationMinutes || 45,
        experience: (row?.level as "beginner" | "intermediate" | "advanced") || "beginner",
        activityLevel: row?.activityLevel || "moderately_active",
        equipment: (row?.equipment as string[]) || ["bodyweight", "dumbbells"],
        trainingPreferences: (row?.trainingPreferences as string[]) || ["hypertrophy", "compound"],
      }}
    />
  );
}

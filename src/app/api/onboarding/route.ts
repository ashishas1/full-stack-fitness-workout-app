import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    onboardingCompleted: row.onboardingCompleted,
    profile: {
      name: row.name || row.username,
      dateOfBirth: row.dateOfBirth,
      age: row.age,
      gender: row.gender,
      heightCm: row.heightCm ? Number(row.heightCm) : null,
      weightKg: row.weightKg ? Number(row.weightKg) : null,
      unitsPreference: row.unitsPreference,
      primaryGoal: row.primaryGoal,
      secondaryGoals: row.secondaryGoals || [],
      currentBodyFat: row.currentBodyFat ? Number(row.currentBodyFat) : null,
      targetBodyFat: row.targetBodyFat ? Number(row.targetBodyFat) : null,
      targetWeight: row.targetWeight ? Number(row.targetWeight) : null,
      targetTimelineWeeks: row.targetTimelineWeeks || 12,
      trainingDaysPerWeek: row.trainingDaysPerWeek || 4,
      workoutDurationMinutes: row.workoutDurationMinutes || 45,
      activityLevel: row.activityLevel,
      level: row.level,
      equipment: row.equipment || ["bodyweight", "dumbbells"],
      trainingPreferences: row.trainingPreferences || ["hypertrophy", "compound"],
      enjoyedExercises: row.enjoyedExercises || [],
      dislikedExercises: row.dislikedExercises || [],
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const name = String(body.name ?? user.username).trim();
    const age = body.age ? Number(body.age) : null;
    const gender = String(body.gender ?? "prefer_not_to_say");
    const heightCm = body.heightCm ? String(Number(body.heightCm)) : null;
    const weightKg = body.weightKg ? String(Number(body.weightKg)) : null;
    const unitsPreference = body.unitsPreference === "imperial" ? "imperial" : "metric";

    const primaryGoal = String(body.primaryGoal ?? "build_muscle");
    const secondaryGoals = Array.isArray(body.secondaryGoals) ? body.secondaryGoals : [];

    const currentBodyFat = body.currentBodyFat ? String(Number(body.currentBodyFat)) : null;
    const targetBodyFat = body.targetBodyFat ? String(Number(body.targetBodyFat)) : null;
    const targetWeight = body.targetWeight ? String(Number(body.targetWeight)) : null;
    const targetTimelineWeeks = Number(body.targetTimelineWeeks) || 12;

    const trainingDaysPerWeek = Math.min(7, Math.max(2, Number(body.trainingDaysPerWeek) || 4));
    const workoutDurationMinutes = Number(body.workoutDurationMinutes) || 45;
    const activityLevel = String(body.activityLevel ?? "moderately_active");
    const level = ["beginner", "intermediate", "advanced"].includes(body.level)
      ? body.level
      : "beginner";

    const equipment = Array.isArray(body.equipment) && body.equipment.length > 0
      ? body.equipment
      : ["bodyweight", "dumbbells"];
    const trainingPreferences = Array.isArray(body.trainingPreferences) && body.trainingPreferences.length > 0
      ? body.trainingPreferences
      : ["hypertrophy", "compound"];
    const enjoyedExercises = Array.isArray(body.enjoyedExercises) ? body.enjoyedExercises : [];
    const dislikedExercises = Array.isArray(body.dislikedExercises) ? body.dislikedExercises : [];

    const [updated] = await db
      .update(users)
      .set({
        onboardingCompleted: true,
        name,
        age,
        gender,
        heightCm,
        weightKg,
        unitsPreference,
        primaryGoal,
        secondaryGoals,
        goal: primaryGoal,
        currentBodyFat,
        targetBodyFat,
        targetWeight,
        targetTimelineWeeks,
        trainingDaysPerWeek,
        workoutDurationMinutes,
        activityLevel,
        level,
        equipment,
        trainingPreferences,
        enjoyedExercises,
        dislikedExercises,
      })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      ok: true,
      message: "Fitness profile forged successfully! Welcome to your personalized dashboard.",
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        onboardingCompleted: updated.onboardingCompleted,
        primaryGoal: updated.primaryGoal,
        level: updated.level,
      },
    });
  } catch (error) {
    console.error("Onboarding submission error:", error);
    return NextResponse.json(
      { error: "Failed to save fitness onboarding profile. Please try again." },
      { status: 500 }
    );
  }
}

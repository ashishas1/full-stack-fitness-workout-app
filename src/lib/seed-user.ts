import { db } from "@/db";
import { exercises, planExercises, plans } from "@/db/schema";
import { BASE_EXERCISES, BASE_PLANS } from "@/lib/seed-data";

/** Ensures the global exercise library exists, then clones starter plans for a user. */
export async function seedStarterPlans(userId: number): Promise<void> {
  let all = await db.select().from(exercises);
  if (all.length === 0) {
    await db.insert(exercises).values(
      BASE_EXERCISES.map((e) => ({
        name: e.name,
        targetArea: e.targetArea,
        difficulty: e.difficulty,
        equipment: e.equipment,
        description: e.description,
        steps: e.steps,
        tips: e.tips,
        sets: e.sets,
        reps: e.reps,
        durationSeconds: e.durationSeconds,
        restSeconds: e.restSeconds,
        kcalPerMin: e.kcalPerMin,
        accent: e.accent,
        icon: e.icon,
        isCustom: false,
        userId: null,
      }))
    );
    all = await db.select().from(exercises);
  }
  const byName = new Map(all.map((e) => [e.name, e]));
  for (const p of BASE_PLANS) {
    const [plan] = await db
      .insert(plans)
      .values({
        userId,
        name: p.name,
        description: p.description,
        level: p.level,
        focus: p.focus,
      })
      .returning();
    for (let i = 0; i < p.items.length; i++) {
      const it = p.items[i];
      const ex = byName.get(it.exercise);
      if (!ex) continue;
      await db.insert(planExercises).values({
        planId: plan.id,
        exerciseId: ex.id,
        orderIndex: i,
        sets: it.sets ?? ex.sets,
        reps: it.reps ?? ex.reps,
        durationSeconds:
          it.duration !== undefined ? it.duration : ex.durationSeconds,
        restSeconds: it.rest ?? ex.restSeconds,
      });
    }
  }
}

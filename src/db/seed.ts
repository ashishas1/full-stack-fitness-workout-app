import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  planExercises,
  plans,
  progressLogs,
  sessionLogs,
  users,
  workoutSessions,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { seedStarterPlans } from "@/lib/seed-user";

/* Deterministic PRNG so reseeds look the same */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

const DEMO_EMAIL = "demo@sixforge.app";

async function main() {
  console.log("Seeding SIXFORGE…");

  // fresh demo user (cascades wipe old demo data)
  await db.delete(users).where(eq(users.email, DEMO_EMAIL));
  const [demo] = await db
    .insert(users)
    .values({
      username: "Alex",
      email: DEMO_EMAIL,
      passwordHash: hashPassword("demo1234"),
      goal: "shred",
      level: "intermediate",
    })
    .returning();
  console.log("demo user:", demo.email, "(password: demo1234)");

  await seedStarterPlans(demo.id);
  console.log("starter plans cloned");

  const userPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, demo.id));
  const allPlanItems = await db
    .select({
      planId: planExercises.planId,
      exerciseId: exercises.id,
      name: exercises.name,
      sets: planExercises.sets,
      reps: planExercises.reps,
    })
    .from(planExercises)
    .innerJoin(exercises, eq(exercises.id, planExercises.exerciseId));

  // ---- 8 weeks of realistic training history ----
  const now = new Date();
  let sessionCount = 0;
  const notesPool = [
    "Felt strong today, planks are getting easier.",
    "Lower abs were on fire. Hurt so good.",
    "Quick one before work — consistency over intensity.",
    "Struggled with hanging raises, grip gave out first.",
    "New personal best on rollouts.",
    "",
    "",
  ];
  for (let dayOffset = 55; dayOffset >= 1; dayOffset--) {
    const dow = dayOffset % 7; // pseudo weekly pattern
    const trains = [0, 2, 4].includes(dow) || (dow === 5 && rand() > 0.5);
    const skipRandom = rand() < 0.12 && dayOffset > 7; // fewer skips recently
    if (!trains || skipRandom) continue;

    const plan = userPlans[sessionCount % userPlans.length];
    const items = allPlanItems.filter((it) => it.planId === plan.id);
    const started = new Date(now.getTime() - dayOffset * 86400000);
    started.setHours(rand() > 0.5 ? 6 : 18, 30 + Math.floor(rand() * 20), 0, 0);

    const estSets = items.reduce((a: number, it) => a + it.sets, 0);
    const duration = Math.round(
      estSets * (55 + rand() * 40) + rand() * 120
    );
    const abandoned = sessionCount > 2 && rand() < 0.06;

    const [session] = await db
      .insert(workoutSessions)
      .values({
        userId: demo.id,
        planId: plan.id,
        planName: plan.name,
        status: abandoned ? "abandoned" : "completed",
        startedAt: started,
        endedAt: new Date(started.getTime() + duration * 1000),
        durationSeconds: duration,
        notes: notesPool[Math.floor(rand() * notesPool.length)],
      })
      .returning();

    const logValues = items.map((it) => ({
      sessionId: session.id,
      exerciseId: it.exerciseId,
      exerciseName: it.name,
      sets: Math.max(1, it.sets - (rand() < 0.25 ? 1 : 0)),
      reps: it.reps,
    }));
    if (logValues.length > 0) {
      await db.insert(sessionLogs).values(
        logValues.map((l) => ({ ...l, sets: abandoned ? Math.max(1, l.sets - 1) : l.sets }))
      );
    }
    sessionCount++;
  }
  console.log(`seeded ${sessionCount} workout sessions`);

  // ---- 9 weekly body measurements ----
  const notePool = [
    "Fasted, morning.",
    "Post-vacation bloat.",
    "Waist finally moving again.",
    "Held steady — trust the process.",
    "Ab lines starting to show in good light.",
    "",
  ];
  let w = 82.4;
  let waist = 86.0;
  for (let i = 8; i >= 0; i--) {
    w = Math.max(77, w - (0.4 + rand() * 0.5) + (rand() < 0.2 ? 0.6 : 0));
    waist = Math.max(80.2, waist - (0.4 + rand() * 0.5) + (rand() < 0.15 ? 0.4 : 0));
    const date = new Date(now.getTime() - i * 7 * 86400000);
    date.setHours(7, 15, 0, 0);
    await db.insert(progressLogs).values({
      userId: demo.id,
      date,
      weightKg: w.toFixed(1),
      waistCm: waist.toFixed(1),
      note: notePool[Math.floor(rand() * notePool.length)],
    });
  }
  console.log("seeded 9 progress logs");
  console.log("Done. Log in with demo@sixforge.app / demo1234");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

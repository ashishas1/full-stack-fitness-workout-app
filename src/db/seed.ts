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
  workoutPrograms,
  programWeeks,
  programDays,
  programDayExercises,
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

  // ---- Seed Structured Programs if empty ----
  const existingProg = await db.select().from(workoutPrograms).limit(1);
  if (existingProg.length === 0) {
    console.log("Seeding structured workout programs into Neon...");
    const exList = await db.select().from(exercises);
    const exMap = new Map<string, number>();
    for (const e of exList) {
      exMap.set(e.name.toLowerCase(), e.id);
    }
    const defaultExId = exList[0]?.id || 1;

    const programsData = [
      {
        title: "PPL Hypertrophy 4-Week Block",
        slug: "ppl-hypertrophy-4-week",
        description: "The golden standard of athletic bodybuilding. 6-day split alternating Push, Pull, and Legs with high-tension mechanical overload.",
        level: "intermediate",
        durationWeeks: 4,
        daysPerWeek: 6,
        category: "hypertrophy",
        days: [
          { name: "Day 1: Push (Chest & Shoulders Focus)", focus: "chest", isRest: false, exercises: ["Bench Press", "Incline Dumbbell Press", "Push-up", "Cable Chest Fly"] },
          { name: "Day 2: Pull (Upper Back & Biceps Focus)", focus: "back", isRest: false, exercises: ["Barbell Row", "Lat Pulldown", "Bicep Curl", "Hammer Curl"] },
          { name: "Day 3: Legs (Quad Dominant & Calves)", focus: "legs", isRest: false, exercises: ["Barbell Squat", "Leg Press", "Romanian Deadlift", "Calf Raise"] },
          { name: "Day 4: Push (Triceps & Delts Focus)", focus: "shoulders", isRest: false, exercises: ["Overhead Press", "Dips", "Lateral Raise", "Tricep Pushdown"] },
          { name: "Day 5: Pull (Lats & Rear Delts Focus)", focus: "back", isRest: false, exercises: ["Deadlift", "Pull-up", "Face Pull", "Preacher Curl"] },
          { name: "Day 6: Legs (Hamstrings & Glutes Focus)", focus: "legs", isRest: false, exercises: ["Bulgarian Split Squat", "Leg Curl", "Hip Thrust", "Walking Lunge"] },
          { name: "Day 7: Active Recovery & Mobility", focus: "recovery", isRest: true, exercises: [] }
        ]
      },
      {
        title: "Upper / Lower Power Split",
        slug: "upper-lower-power-split",
        description: "Maximum training efficiency with 4 focused sessions per week. Allows superior recovery while maintaining high weekly volume.",
        level: "beginner",
        durationWeeks: 4,
        daysPerWeek: 4,
        category: "strength",
        days: [
          { name: "Day 1: Upper Body Power", focus: "upper", isRest: false, exercises: ["Bench Press", "Barbell Row", "Overhead Press", "Bicep Curl"] },
          { name: "Day 2: Lower Body Power", focus: "lower", isRest: false, exercises: ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Calf Raise"] },
          { name: "Day 3: Rest & Regeneration", focus: "rest", isRest: true, exercises: [] },
          { name: "Day 4: Upper Body Hypertrophy", focus: "upper", isRest: false, exercises: ["Incline Dumbbell Press", "Lat Pulldown", "Lateral Raise", "Tricep Pushdown"] },
          { name: "Day 5: Lower Body Hypertrophy", focus: "lower", isRest: false, exercises: ["Leg Curl", "Bulgarian Split Squat", "Leg Extension", "Hanging Leg Raise"] },
          { name: "Day 6: Rest & Core Mobility", focus: "rest", isRest: true, exercises: [] },
          { name: "Day 7: Rest & Nutrition Prep", focus: "rest", isRest: true, exercises: [] }
        ]
      },
      {
        title: "Core Shred & Midline Dominance",
        slug: "core-shred-midline-dominance",
        description: "Engineered specifically for six-pack definition, deep obliques, and rotational core bracing. High density abdominal training.",
        level: "advanced",
        durationWeeks: 4,
        daysPerWeek: 5,
        category: "shred",
        days: [
          { name: "Day 1: Anti-Extension Core Circuit", focus: "core", isRest: false, exercises: ["Plank", "Ab Wheel Rollout", "Hanging Leg Raise", "Dead Bug"] },
          { name: "Day 2: Rotational & Oblique Power", focus: "obliques", isRest: false, exercises: ["Russian Twist", "Side Plank", "Cable Woodchopper", "Bicycle Crunch"] },
          { name: "Day 3: Midline Isometric Stability", focus: "core", isRest: false, exercises: ["Hollow Body Hold", "Pallof Press", "L-Sit", "Reverse Crunch"] },
          { name: "Day 4: Rest & Myofascial Release", focus: "recovery", isRest: true, exercises: [] },
          { name: "Day 5: Core Density Finisher", focus: "core", isRest: false, exercises: ["Mountain Climber", "Toe Touches", "V-Ups", "Plank"] }
        ]
      }
    ];

    for (const p of programsData) {
      const [prog] = await db
        .insert(workoutPrograms)
        .values({
          title: p.title,
          slug: p.slug,
          description: p.description,
          level: p.level,
          durationWeeks: p.durationWeeks,
          daysPerWeek: p.daysPerWeek,
          category: p.category,
        })
        .returning();

      for (let w = 1; w <= p.durationWeeks; w++) {
        const [week] = await db
          .insert(programWeeks)
          .values({
            programId: prog.id,
            weekNumber: w,
            title: `Week ${w}: ${w === p.durationWeeks ? "Peak Intensity" : "Progressive Overload"}`,
          })
          .returning();

        for (let d = 0; d < p.days.length; d++) {
          const dayData = p.days[d];
          const [day] = await db
            .insert(programDays)
            .values({
              weekId: week.id,
              dayNumber: d + 1,
              name: dayData.name,
              focus: dayData.focus,
              isRestDay: dayData.isRest,
            })
            .returning();

          if (!dayData.isRest) {
            for (let eIdx = 0; eIdx < dayData.exercises.length; eIdx++) {
              const exName = dayData.exercises[eIdx];
              const exId = exMap.get(exName.toLowerCase()) || defaultExId;
              await db.insert(programDayExercises).values({
                dayId: day.id,
                exerciseId: exId,
                orderIndex: eIdx + 1,
                sets: 4,
                reps: "8-12",
                restSeconds: 60,
              });
            }
          }
        }
      }
    }
    console.log("Structured programs successfully seeded into Neon!");
  }

  console.log("Done. Log in with demo@sixforge.app / demo1234");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

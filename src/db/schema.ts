import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // user | trainer | staff | admin | super_admin
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  name: text("name"),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  age: integer("age"),
  gender: text("gender").notNull().default("prefer_not_to_say"), // male | female | other | prefer_not_to_say
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
  unitsPreference: text("units_preference").notNull().default("metric"), // metric | imperial
  primaryGoal: text("primary_goal").notNull().default("build_muscle"), // build_muscle | lose_fat | gain_weight | improve_strength | improve_endurance | general_fitness | athletic_performance
  secondaryGoals: jsonb("secondary_goals").$type<string[]>().notNull().default([]),
  currentBodyFat: numeric("current_body_fat", { precision: 4, scale: 1 }),
  targetBodyFat: numeric("target_body_fat", { precision: 4, scale: 1 }),
  targetWeight: numeric("target_weight", { precision: 5, scale: 1 }),
  targetTimelineWeeks: integer("target_timeline_weeks").notNull().default(12),
  trainingDaysPerWeek: integer("training_days_per_week").notNull().default(4),
  workoutDurationMinutes: integer("workout_duration_minutes").notNull().default(45),
  activityLevel: text("activity_level").notNull().default("moderately_active"), // sedentary | lightly_active | moderately_active | very_active | extremely_active
  equipment: jsonb("equipment").$type<string[]>().notNull().default(["bodyweight", "dumbbells"]),
  trainingPreferences: jsonb("training_preferences").$type<string[]>().notNull().default(["hypertrophy", "compound"]),
  enjoyedExercises: jsonb("enjoyed_exercises").$type<string[]>().notNull().default([]),
  dislikedExercises: jsonb("disliked_exercises").$type<string[]>().notNull().default([]),
  avatarUrl: text("avatar_url"),
  goal: text("goal").notNull().default("shred"),
  level: text("level").notNull().default("beginner"),
  membershipTier: text("membership_tier").notNull().default("free"), // free | monthly | yearly | lifetime
  membershipExpiresAt: timestamp("membership_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  targetArea: text("target_area").notNull(), // upper | lower | obliques | full
  primaryMuscle: text("primary_muscle"),
  secondaryMuscles: jsonb("secondary_muscles").$type<string[]>().notNull().default([]),
  difficulty: text("difficulty").notNull().default("beginner"), // beginner | intermediate | advanced
  equipment: text("equipment").notNull().default("none"), // none | dumbbells | barbell | machines | cable | bands | kettlebells | bench | mat | wheel
  exerciseType: text("exercise_type").notNull().default("strength"), // strength | hypertrophy | endurance | mobility | cardio
  movementPattern: text("movement_pattern").notNull().default("push"), // push | pull | squat | hinge | lunge | carry | rotation | isolation
  bodyPart: text("body_part").notNull().default("core"), // chest | back | shoulders | legs | arms | core | full_body
  description: text("description").notNull().default(""),
  thumbnail: text("thumbnail"),
  startPositionMedia: text("start_position_media"),
  movementMedia: text("movement_media"),
  endPositionMedia: text("end_position_media"),
  instructionalVideo: text("instructional_video"),
  setupInstructions: text("setup_instructions"),
  movementInstructions: text("movement_instructions"),
  finishInstructions: text("finish_instructions"),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  tips: jsonb("tips").$type<string[]>().notNull().default([]),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().notNull().default([]),
  formTips: jsonb("form_tips").$type<string[]>().notNull().default([]),
  safety: text("safety"),
  alternatives: jsonb("alternatives").$type<string[]>().notNull().default([]),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("12"),
  durationSeconds: integer("duration_seconds"),
  restSeconds: integer("rest_seconds").notNull().default(45),
  kcalPerMin: integer("kcal_per_min").notNull().default(8),
  accent: text("accent").notNull().default("volt"), // volt | ember | frost | ghost
  icon: text("icon").notNull().default("flame"),
  isCustom: boolean("is_custom").notNull().default(false),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  level: text("level").notNull().default("beginner"),
  focus: text("focus").notNull().default("full"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const planExercises = pgTable("plan_exercises", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("12"),
  durationSeconds: integer("duration_seconds"),
  restSeconds: integer("rest_seconds").notNull().default(45),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").references(() => plans.id, {
    onDelete: "set null",
  }),
  planName: text("plan_name").notNull().default("Free Session"),
  status: text("status").notNull().default("active"), // active | completed | abandoned
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  totalVolumeKg: numeric("total_volume_kg", { precision: 8, scale: 2 }).notNull().default("0"),
  caloriesBurned: integer("calories_burned").notNull().default(0),
  completedSetsCount: integer("completed_sets_count").notNull().default(0),
  notes: text("notes").notNull().default(""),
});

export const sessionLogs = pgTable("session_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").references(() => exercises.id, {
    onDelete: "set null",
  }),
  exerciseName: text("exercise_name").notNull(),
  sets: integer("sets").notNull().default(0),
  reps: text("reps").notNull().default(""),
});

export const exerciseSets = pgTable("exercise_sets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").references(() => exercises.id, {
    onDelete: "set null",
  }),
  exerciseName: text("exercise_name").notNull(),
  setNumber: integer("set_number").notNull(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }).notNull().default("0"),
  reps: integer("reps").notNull().default(0),
  rpe: numeric("rpe", { precision: 3, scale: 1 }).default("8"),
  isWarmup: boolean("is_warmup").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").references(() => exercises.id, {
    onDelete: "set null",
  }),
  exerciseName: text("exercise_name").notNull(),
  recordType: text("record_type").notNull(), // heaviest_weight | max_reps | estimated_1rm | max_volume
  value: numeric("value", { precision: 7, scale: 2 }).notNull(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  reps: integer("reps"),
  sessionId: integer("session_id").references(() => workoutSessions.id, {
    onDelete: "set null",
  }),
  achievedAt: timestamp("achieved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("strength"), // strength | body | consistency | performance
  targetValue: numeric("target_value", { precision: 7, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 7, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("kg"),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: text("status").notNull().default("in_progress"), // in_progress | completed
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementKey: text("achievement_key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("trophy"),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("system"), // pr_achieved | streak_milestone | workout_completed | achievement_unlocked | payment_success | membership_expiring | system
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  data: jsonb("data"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id, {
    onDelete: "set null",
  }),
  adminEmail: text("admin_email"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const progressLogs = pgTable("progress_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
  waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
  chestCm: numeric("chest_cm", { precision: 5, scale: 1 }),
  armsCm: numeric("arms_cm", { precision: 5, scale: 1 }),
  thighsCm: numeric("thighs_cm", { precision: 5, scale: 1 }),
  bodyFatPct: numeric("body_fat_pct", { precision: 4, scale: 1 }),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: text("order_id"),
  gatewayPaymentId: text("gateway_payment_id"),
  tier: text("tier").notNull(), // monthly | yearly | lifetime
  amount: integer("amount").notNull(), // 99 | 550 | 1200
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("paid"), // pending | paid | failed
  paymentMethod: text("payment_method").notNull().default("upi"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export const workoutPrograms = pgTable("workout_programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  level: text("level").notNull().default("beginner"), // beginner | intermediate | advanced
  durationWeeks: integer("duration_weeks").notNull().default(4),
  daysPerWeek: integer("days_per_week").notNull().default(3),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("hypertrophy"), // hypertrophy | strength | shred | endurance
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const programWeeks = pgTable("program_weeks", {
  id: serial("id").primaryKey(),
  programId: integer("program_id")
    .notNull()
    .references(() => workoutPrograms.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
});

export const programDays = pgTable("program_days", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id")
    .notNull()
    .references(() => programWeeks.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  name: text("name").notNull(),
  focus: text("focus").notNull().default("full"),
  isRestDay: boolean("is_rest_day").notNull().default(false),
});

export const programDayExercises = pgTable("program_day_exercises", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id")
    .notNull()
    .references(() => programDays.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("10"),
  restSeconds: integer("rest_seconds").notNull().default(60),
});

export const programEnrollments = pgTable("program_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  programId: integer("program_id")
    .notNull()
    .references(() => workoutPrograms.id, { onDelete: "cascade" }),
  currentWeek: integer("current_week").notNull().default(1),
  currentDay: integer("current_day").notNull().default(1),
  status: text("status").notNull().default("active"), // active | completed | dropped
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Exercise = typeof exercises.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type PlanExercise = typeof planExercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type SessionLog = typeof sessionLogs.$inferSelect;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type UserGoal = typeof userGoals.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type ProgressLog = typeof progressLogs.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type User = typeof users.$inferSelect;

export type WorkoutProgram = typeof workoutPrograms.$inferSelect;
export type ProgramWeek = typeof programWeeks.$inferSelect;
export type ProgramDay = typeof programDays.$inferSelect;
export type ProgramDayExercise = typeof programDayExercises.$inferSelect;
export type ProgramEnrollment = typeof programEnrollments.$inferSelect;

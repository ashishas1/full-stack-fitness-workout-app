import { z } from "zod";
import {
  Difficulty,
  EquipmentType,
  ExerciseCategory,
  FitnessGoal,
  FitnessLevel,
  Gender,
  PhotoType,
  Role,
  UnitsPreference,
} from "@prisma/client";

/* ---------------- Auth Validators ---------------- */

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long").trim(),
  role: z.nativeEnum(Role).optional().default(Role.USER),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

/* ---------------- User Profile Validators ---------------- */

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.nativeEnum(Gender).optional(),
  heightCm: z.number().positive().max(300).optional().nullable(),
  weightKg: z.number().positive().max(500).optional().nullable(),
  fitnessLevel: z.nativeEnum(FitnessLevel).optional(),
  trainingExperience: z.string().max(200).optional().nullable(),
  primaryGoal: z.nativeEnum(FitnessGoal).optional(),
  secondaryGoals: z.array(z.nativeEnum(FitnessGoal)).optional(),
  preferredWorkoutDays: z.array(z.number().int().min(0).max(6)).optional(),
  preferredDurationMin: z.number().int().min(10).max(240).optional(),
  availableEquipment: z.array(z.nativeEnum(EquipmentType)).optional(),
  workoutLocation: z.string().max(100).optional().nullable(),
  unitsPreference: z.nativeEnum(UnitsPreference).optional(),
  bio: z.string().max(500).optional().nullable(),
});

/* ---------------- Exercise Validators ---------------- */

export const queryExercisesSchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(ExerciseCategory).optional(),
  equipment: z.nativeEnum(EquipmentType).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  muscle: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["name", "createdAt", "difficulty"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const createExerciseSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  description: z.string().min(10).trim(),
  instructions: z.array(z.string().min(3)).min(1, "At least one instruction is required"),
  category: z.nativeEnum(ExerciseCategory),
  primaryMuscle: z.string().min(2).trim(),
  secondaryMuscles: z.array(z.string()).default([]),
  equipment: z.nativeEnum(EquipmentType).default(EquipmentType.BODYWEIGHT),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.BEGINNER),
  movementPattern: z.string().optional(),
  bodyPart: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  safetyInstructions: z.string().optional().nullable(),
  commonMistakes: z.array(z.string()).default([]),
  beginnerNotes: z.string().optional().nullable(),
  advancedNotes: z.string().optional().nullable(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

/* ---------------- Workout Template Validators ---------------- */

export const createWorkoutTemplateSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  estimatedDuration: z.number().int().positive().default(45),
  workoutType: z.string().optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      orderIndex: z.number().int().nonnegative().default(0),
      targetSets: z.number().int().positive().default(3),
      targetReps: z.string().default("10"),
      targetRpe: z.number().min(1).max(10).optional().nullable(),
      restSeconds: z.number().int().nonnegative().default(60),
      notes: z.string().optional().nullable(),
    })
  ).default([]),
});

export const updateWorkoutTemplateSchema = createWorkoutTemplateSchema.partial();

/* ---------------- Workout Session Validators ---------------- */

export const startSessionSchema = z.object({
  templateId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(100).default("Freestyle Workout"),
  notes: z.string().max(500).optional(),
});

export const recordSetSchema = z.object({
  exerciseId: z.string().uuid().optional(),
  setNumber: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().default(0),
  reps: z.number().int().nonnegative().default(0),
  rpe: z.number().min(1).max(10).optional().nullable(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
  distanceMeters: z.number().nonnegative().optional().nullable(),
  isWarmup: z.boolean().default(false),
  isCompleted: z.boolean().default(true),
});

export const completeSessionSchema = z.object({
  durationSeconds: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  completedSets: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      setNumber: z.number().int().positive(),
      weightKg: z.number().nonnegative(),
      reps: z.number().int().nonnegative(),
      rpe: z.number().min(1).max(10).optional().nullable(),
      isWarmup: z.boolean().default(false),
    })
  ).optional(),
});

/* ---------------- Progress Validators ---------------- */

export const createMeasurementSchema = z.object({
  date: z.string().datetime().optional(),
  weightKg: z.number().positive().max(500).optional().nullable(),
  bodyFatPercentage: z.number().min(1).max(70).optional().nullable(),
  chestCm: z.number().positive().optional().nullable(),
  waistCm: z.number().positive().optional().nullable(),
  armsCm: z.number().positive().optional().nullable(),
  thighsCm: z.number().positive().optional().nullable(),
  hipsCm: z.number().positive().optional().nullable(),
  calvesCm: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createPhotoSchema = z.object({
  date: z.string().datetime().optional(),
  photoType: z.nativeEnum(PhotoType).default(PhotoType.FRONT),
  notes: z.string().max(500).optional().nullable(),
});

/* ---------------- Program Validators ---------------- */

export const createProgramSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10),
  level: z.nativeEnum(FitnessLevel).default(FitnessLevel.BEGINNER),
  durationWeeks: z.number().int().min(1).max(52).default(4),
  daysPerWeek: z.number().int().min(1).max(7).default(3),
  imageUrl: z.string().url().optional().nullable(),
  weeks: z.array(
    z.object({
      weekNumber: z.number().int().positive(),
      description: z.string().optional().nullable(),
      days: z.array(
        z.object({
          dayNumber: z.number().int().positive(),
          name: z.string().min(2),
          isRestDay: z.boolean().default(false),
          exercises: z.array(
            z.object({
              exerciseId: z.string().uuid(),
              orderIndex: z.number().int().nonnegative().default(0),
              targetSets: z.number().int().positive().default(3),
              targetReps: z.string().default("10"),
              restSeconds: z.number().int().nonnegative().default(60),
            })
          ).default([]),
        })
      ),
    })
  ).min(1),
});

export const updateProgramSchema = createProgramSchema.partial();

/* ---------------- Inferred Types ---------------- */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type QueryExercisesInput = z.infer<typeof queryExercisesSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type CreateWorkoutTemplateInput = z.infer<typeof createWorkoutTemplateSchema>;
export type UpdateWorkoutTemplateInput = z.infer<typeof updateWorkoutTemplateSchema>;
export type StartWorkoutSessionInput = z.infer<typeof startSessionSchema>;
export type LogWorkoutSetInput = z.infer<typeof recordSetSchema>;
export type UpdateWorkoutSetInput = Partial<LogWorkoutSetInput>;
export type CompleteWorkoutSessionInput = z.infer<typeof completeSessionSchema>;
export type RecordMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { PRService } from './pr.service';
import { calculateCaloriesBurned, calculateCurrentStreak } from '../utils/calculations';
import {
  StartWorkoutSessionInput,
  CompleteWorkoutSessionInput,
  LogWorkoutSetInput,
  UpdateWorkoutSetInput,
} from '../validators';

export class SessionService {
  /**
   * Start a new workout session (optionally from a template)
   */
  static async startSession(userId: string, input: StartWorkoutSessionInput) {
    const { templateId, name: customName, notes } = input;

    // Check if there is already an in-progress workout session
    const existingActive = await prisma.workoutSession.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
    });

    if (existingActive) {
      throw new BadRequestError(
        'You already have an active workout session in progress. Please complete or abandon it first.'
      );
    }

    let sessionName = customName || 'Quick Workout';
    let templateExercises: any[] = [];

    if (templateId) {
      const template = await prisma.workoutTemplate.findUnique({
        where: { id: templateId },
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!template) {
        throw new NotFoundError('Workout template not found');
      }

      if (!template.isPublic && template.userId !== userId) {
        throw new ForbiddenError('You do not have access to this template');
      }

      sessionName = customName || template.name;
      templateExercises = template.exercises;
    }

    const session = await prisma.workoutSession.create({
      data: {
        userId,
        templateId: templateId || undefined,
        name: sessionName,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        notes,
        exercises: {
          create: templateExercises.map((te, idx) => ({
            exerciseId: te.exerciseId,
            orderIndex: te.orderIndex ?? idx,
            notes: te.notes,
            sets: {
              create: Array.from({ length: te.targetSets || 3 }).map((_, setIdx) => ({
                setNumber: setIdx + 1,
                reps: parseInt(te.targetReps, 10) || 10,
                weightKg: 0,
                isCompleted: false,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return session;
  }

  /**
   * Get active session for user
   */
  static async getActiveSession(userId: string) {
    const active = await prisma.workoutSession.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return active;
  }

  /**
   * Get session by ID
   */
  static async getSessionById(sessionId: string, userId: string) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        personalRecords: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Workout session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenError('You do not have access to this session');
    }

    return session;
  }

  /**
   * List user workout sessions
   */
  static async getUserSessions(
    userId: string,
    options: {
      status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { status, startDate, endDate, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = startDate;
      if (endDate) where.startedAt.lte = endDate;
    }

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        include: {
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
              sets: {
                select: {
                  id: true,
                  weightKg: true,
                  reps: true,
                  isCompleted: true,
                  isPersonalRecord: true,
                },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
          _count: {
            select: {
              personalRecords: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workoutSession.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add an exercise to an active session
   */
  static async addExerciseToSession(
    sessionId: string,
    userId: string,
    exerciseId: string,
    notes?: string
  ) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: { exercises: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot modify an already completed or abandoned session');
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    const nextOrder = session.exercises.length;

    const sessionExercise = await prisma.workoutSessionExercise.create({
      data: {
        sessionId,
        exerciseId,
        orderIndex: nextOrder,
        notes,
        sets: {
          create: [
            {
              setNumber: 1,
              weightKg: 0,
              reps: 10,
              isCompleted: false,
            },
          ],
        },
      },
      include: {
        exercise: true,
        sets: true,
      },
    });

    return sessionExercise;
  }

  /**
   * Remove an exercise from an active session
   */
  static async removeExerciseFromSession(
    sessionId: string,
    userId: string,
    sessionExerciseId: string
  ) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot modify an already completed or abandoned session');
    }

    const exercise = await prisma.workoutSessionExercise.findUnique({
      where: { id: sessionExerciseId },
    });

    if (!exercise || exercise.sessionId !== sessionId) {
      throw new NotFoundError('Exercise not found in this session');
    }

    await prisma.workoutSessionExercise.delete({
      where: { id: sessionExerciseId },
    });

    return { message: 'Exercise removed from session' };
  }

  /**
   * Log a set in a session exercise
   */
  static async logSet(
    sessionId: string,
    userId: string,
    sessionExerciseId: string,
    input: LogWorkoutSetInput
  ) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot log sets in a completed or abandoned session');
    }

    const sessionExercise = await prisma.workoutSessionExercise.findUnique({
      where: { id: sessionExerciseId },
      include: { sets: true },
    });

    if (!sessionExercise || sessionExercise.sessionId !== sessionId) {
      throw new NotFoundError('Exercise not found in this session');
    }

    const setNumber = input.setNumber || sessionExercise.sets.length + 1;

    const set = await prisma.workoutSessionSet.create({
      data: {
        sessionExerciseId,
        setNumber,
        weightKg: input.weightKg,
        reps: input.reps,
        rpe: input.rpe,
        durationSeconds: input.durationSeconds,
        distanceMeters: input.distanceMeters,
        isWarmup: input.isWarmup ?? false,
        isCompleted: input.isCompleted ?? true,
      },
    });

    return set;
  }

  /**
   * Update a set
   */
  static async updateSet(
    sessionId: string,
    userId: string,
    setId: string,
    input: UpdateWorkoutSetInput
  ) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    const set = await prisma.workoutSessionSet.findUnique({
      where: { id: setId },
      include: { sessionExercise: true },
    });

    if (!set || set.sessionExercise.sessionId !== sessionId) {
      throw new NotFoundError('Set not found in this session');
    }

    const updated = await prisma.workoutSessionSet.update({
      where: { id: setId },
      data: input,
    });

    return updated;
  }

  /**
   * Delete a set
   */
  static async deleteSet(sessionId: string, userId: string, setId: string) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    const set = await prisma.workoutSessionSet.findUnique({
      where: { id: setId },
      include: { sessionExercise: true },
    });

    if (!set || set.sessionExercise.sessionId !== sessionId) {
      throw new NotFoundError('Set not found in this session');
    }

    await prisma.workoutSessionSet.delete({
      where: { id: setId },
    });

    return { message: 'Set deleted successfully' };
  }

  /**
   * Complete a session
   */
  static async completeSession(
    sessionId: string,
    userId: string,
    input: CompleteWorkoutSessionInput = {}
  ) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    if (session.status === 'COMPLETED') {
      throw new BadRequestError('This session is already completed');
    }

    const endedAt = new Date();
    const durationSeconds =
      input.durationSeconds ||
      Math.max(1, Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000));

    // Calculate total volume (sum of weight * reps for completed non-warmup sets)
    let totalVolumeKg = 0;
    for (const ex of session.exercises) {
      for (const st of ex.sets) {
        if (st.isCompleted && !st.isWarmup && st.weightKg > 0 && st.reps > 0) {
          totalVolumeKg += st.weightKg * st.reps;
        }
      }
    }

    // Get user weight for calorie estimation
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { weightKg: true },
    });

    const userWeight = profile?.weightKg || 70;
    const durationMinutes = Math.round(durationSeconds / 60);
    const estimatedCalories = calculateCaloriesBurned(durationMinutes, userWeight);

    // Update session
    const completedSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt,
        durationSeconds,
        totalVolumeKg,
        totalCalories: estimatedCalories,
        notes: input.notes !== undefined ? input.notes : session.notes,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Check and record PRs
    const newPRs = await PRService.checkAndRecordSessionPRs(sessionId, userId);

    // Calculate updated workout streak
    const completedWorkouts = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    });

    const workoutDates = completedWorkouts.map((w) => w.startedAt);
    const currentStreak = calculateCurrentStreak(workoutDates);

    // Send streak milestone notification if applicable
    if ([3, 7, 14, 30, 50, 100].includes(currentStreak)) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'STREAK_MILESTONE',
          title: `🔥 ${currentStreak}-Day Workout Streak!`,
          message: `Incredible consistency! You have logged workouts for ${currentStreak} days!`,
          metadata: { streak: currentStreak },
        },
      });
    }

    return {
      session: completedSession,
      summary: {
        durationSeconds,
        durationMinutes,
        totalVolumeKg,
        estimatedCalories,
        newPRs,
        currentStreak,
      },
    };
  }

  /**
   * Abandon an in-progress session
   */
  static async abandonSession(sessionId: string, userId: string) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Only in-progress sessions can be abandoned');
    }

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'ABANDONED',
        endedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: string, userId: string) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    await prisma.workoutSession.delete({
      where: { id: sessionId },
    });

    return { message: 'Workout session deleted successfully' };
  }
}

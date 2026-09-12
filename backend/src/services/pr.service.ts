import { prisma } from '../config/database';
import { RecordType } from '@prisma/client';
import { calculateEpley1RM } from '../utils/calculations';
import { NotFoundError } from '../utils/errors';

export interface PRResult {
  exerciseId: string;
  exerciseName: string;
  recordType: RecordType;
  value: number;
  previousValue: number | null;
  isNew: boolean;
}

export class PRService {
  /**
   * Process a completed workout session and detect/record any new PRs
   */
  static async checkAndRecordSessionPRs(sessionId: string, userId: string): Promise<PRResult[]> {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              where: { isCompleted: true },
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Workout session not found');
    }

    const newPRs: PRResult[] = [];

    // Process each exercise
    for (const sessionExercise of session.exercises) {
      const exercise = sessionExercise.exercise;
      const sets = sessionExercise.sets;

      if (sets.length === 0) continue;

      // Existing PRs for this user & exercise
      const existingPRs = await prisma.personalRecord.findMany({
        where: {
          userId,
          exerciseId: exercise.id,
        },
      });

      const prMap = new Map<RecordType, { id: string; value: number }>();
      for (const pr of existingPRs) {
        prMap.set(pr.recordType, { id: pr.id, value: pr.value });
      }

      // Track session maximums
      let maxWeight = 0;
      let maxWeightSetId: string | null = null;

      let maxReps = 0;
      let maxRepsSetId: string | null = null;

      let max1RM = 0;
      let max1RMSetId: string | null = null;

      let maxVolume = 0;
      let maxVolumeSetId: string | null = null;

      for (const set of sets) {
        // Skip warmup sets for records
        if (set.isWarmup) continue;

        const weight = set.weightKg || 0;
        const reps = set.reps || 0;

        // Heaviest Weight
        if (weight > maxWeight) {
          maxWeight = weight;
          maxWeightSetId = set.id;
        }

        // Max Reps
        if (reps > maxReps) {
          maxReps = reps;
          maxRepsSetId = set.id;
        }

        // Estimated 1RM
        if (weight > 0 && reps > 0) {
          const estimated1RM = calculateEpley1RM(weight, reps);
          if (estimated1RM > max1RM) {
            max1RM = estimated1RM;
            max1RMSetId = set.id;
          }
        }

        // Max Volume for single set
        const setVolume = weight * reps;
        if (setVolume > maxVolume) {
          maxVolume = setVolume;
          maxVolumeSetId = set.id;
        }
      }

      // Check each record category
      const prChecks: Array<{
        type: RecordType;
        val: number;
        setId: string | null;
      }> = [
        { type: RecordType.HEAVIEST_WEIGHT, val: maxWeight, setId: maxWeightSetId },
        { type: RecordType.MAX_REPS, val: maxReps, setId: maxRepsSetId },
        { type: RecordType.ESTIMATED_1RM, val: max1RM, setId: max1RMSetId },
        { type: RecordType.MAX_VOLUME, val: maxVolume, setId: maxVolumeSetId },
      ];

      const setsToMarkPR = new Set<string>();

      for (const check of prChecks) {
        if (check.val <= 0) continue;

        const existing = prMap.get(check.type);
        const previousVal = existing ? existing.value : null;

        if (!existing || check.val > existing.value) {
          // New PR!
          await prisma.personalRecord.upsert({
            where: {
              userId_exerciseId_recordType: {
                userId,
                exerciseId: exercise.id,
                recordType: check.type,
              },
            },
            create: {
              userId,
              exerciseId: exercise.id,
              recordType: check.type,
              value: check.val,
              previousValue: previousVal,
              workoutSessionId: session.id,
              achievedAt: new Date(),
            },
            update: {
              value: check.val,
              previousValue: previousVal,
              workoutSessionId: session.id,
              achievedAt: new Date(),
            },
          });

          if (check.setId) {
            setsToMarkPR.add(check.setId);
          }

          newPRs.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            recordType: check.type,
            value: check.val,
            previousValue: previousVal,
            isNew: true,
          });
        }
      }

      // Update sets to mark isPersonalRecord = true
      if (setsToMarkPR.size > 0) {
        await prisma.workoutSessionSet.updateMany({
          where: {
            id: { in: Array.from(setsToMarkPR) },
          },
          data: {
            isPersonalRecord: true,
          },
        });
      }
    }

    // If new PRs achieved, generate notifications
    if (newPRs.length > 0) {
      const summaryText = newPRs
        .slice(0, 3)
        .map(
          (pr) =>
            `${pr.exerciseName}: ${pr.recordType.replace('_', ' ')} (${pr.value}${
              pr.recordType === RecordType.MAX_REPS ? ' reps' : ' kg'
            })`
        )
        .join(', ');

      await prisma.notification.create({
        data: {
          userId,
          type: 'PR_ACHIEVED',
          title: `🏆 ${newPRs.length} New Personal Record${newPRs.length > 1 ? 's' : ''}!`,
          message: `Awesome work! You set new personal records in: ${summaryText}`,
          metadata: JSON.parse(
            JSON.stringify({ sessionId, prCount: newPRs.length, prs: newPRs })
          ),
        },
      });
    }

    return newPRs;
  }

  /**
   * Get all personal records for a user
   */
  static async getUserPRs(userId: string, exerciseId?: string) {
    const where: any = { userId };
    if (exerciseId) {
      where.exerciseId = exerciseId;
    }

    return prisma.personalRecord.findMany({
      where,
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            category: true,
            equipment: true,
            imageUrl: true,
          },
        },
        workoutSession: {
          select: {
            id: true,
            name: true,
            startedAt: true,
          },
        },
      },
      orderBy: [{ achievedAt: 'desc' }],
    });
  }

  /**
   * Get progression history of records for an exercise
   */
  static async getExercisePRTimeline(userId: string, exerciseId: string) {
    // Check if exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, name: true, category: true },
    });

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // Fetch all completed sets for this exercise to build a historical progression chart
    const sessionExercises = await prisma.workoutSessionExercise.findMany({
      where: {
        exerciseId,
        session: {
          userId,
          status: 'COMPLETED',
        },
      },
      include: {
        session: {
          select: {
            id: true,
            name: true,
            startedAt: true,
          },
        },
        sets: {
          where: { isCompleted: true },
          orderBy: { setNumber: 'asc' },
        },
      },
      orderBy: {
        session: {
          startedAt: 'asc',
        },
      },
    });

    const progression = sessionExercises.map((se) => {
      let maxWeight = 0;
      let max1RM = 0;
      let totalVolume = 0;

      for (const set of se.sets) {
        if (set.weightKg > maxWeight) maxWeight = set.weightKg;
        const e1rm = calculateEpley1RM(set.weightKg, set.reps);
        if (e1rm > max1RM) max1RM = e1rm;
        totalVolume += set.weightKg * set.reps;
      }

      return {
        sessionId: se.session.id,
        sessionName: se.session.name,
        date: se.session.startedAt,
        maxWeight,
        estimated1RM: max1RM,
        totalVolume,
        setsCount: se.sets.length,
      };
    });

    const currentRecords = await prisma.personalRecord.findMany({
      where: { userId, exerciseId },
    });

    return {
      exercise,
      currentRecords,
      progression,
    };
  }
}

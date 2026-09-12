import { prisma } from '../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { FitnessLevel, EnrollmentStatus } from '@prisma/client';
import { CreateProgramInput, UpdateProgramInput } from '../validators';

export class ProgramService {
  /**
   * Get public programs list
   */
  static async getPrograms(options: {
    level?: FitnessLevel;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { level, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.workoutProgram.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              weeks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workoutProgram.count({ where }),
    ]);

    return {
      programs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single program details with weeks, days, and exercises
   */
  static async getProgramById(programId: string, userId?: string) {
    const program = await prisma.workoutProgram.findUnique({
      where: { id: programId },
      include: {
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { dayNumber: 'asc' },
            },
          },
          orderBy: { weekNumber: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!program) {
      throw new NotFoundError('Program not found');
    }

    let userEnrollment = null;
    if (userId) {
      userEnrollment = await prisma.programEnrollment.findUnique({
        where: {
          userId_programId: {
            userId,
            programId,
          },
        },
      });
    }

    return {
      ...program,
      userEnrollment,
    };
  }

  /**
   * Create program with weeks, days, exercises
   */
  static async createProgram(creatorId: string, input: CreateProgramInput) {
    const { weeks, ...programData } = input;

    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.workoutProgram.create({
        data: {
          ...programData,
          creatorId,
        },
      });

      if (weeks && weeks.length > 0) {
        for (const week of weeks) {
          const createdWeek = await tx.programWeek.create({
            data: {
              programId: created.id,
              weekNumber: week.weekNumber,
              description: week.description,
            },
          });

          if (week.days && week.days.length > 0) {
            for (const day of week.days) {
              const createdDay = await tx.programDay.create({
                data: {
                  weekId: createdWeek.id,
                  dayNumber: day.dayNumber,
                  name: day.name,
                  isRestDay: day.isRestDay ?? false,
                },
              });

              if (day.exercises && day.exercises.length > 0) {
                await tx.programExercise.createMany({
                  data: day.exercises.map((ex, idx) => ({
                    dayId: createdDay.id,
                    exerciseId: ex.exerciseId,
                    orderIndex: ex.orderIndex ?? idx,
                    targetSets: ex.targetSets ?? 3,
                    targetReps: ex.targetReps ?? '10',
                    restSeconds: ex.restSeconds ?? 60,
                  })),
                });
              }
            }
          }
        }
      }

      return created;
    });

    return this.getProgramById(program.id);
  }

  /**
   * Enroll user in program
   */
  static async enrollUser(userId: string, programId: string) {
    const program = await prisma.workoutProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundError('Program not found');
    }

    // Check existing enrollment
    const existing = await prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new BadRequestError('You are already actively enrolled in this program');
      }

      // Reactivate
      const reactivated = await prisma.programEnrollment.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
          currentWeek: 1,
          currentDay: 1,
          completedAt: null,
        },
      });

      return reactivated;
    }

    const enrollment = await prisma.programEnrollment.create({
      data: {
        userId,
        programId,
        startDate: new Date(),
        currentWeek: 1,
        currentDay: 1,
        status: 'ACTIVE',
      },
      include: {
        program: true,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'PROGRAM_UPDATE',
        title: `Enrolled in ${program.title}!`,
        message: `You have successfully enrolled in ${program.title}. Let's crush week 1, day 1!`,
        metadata: { programId, enrollmentId: enrollment.id },
      },
    });

    return enrollment;
  }

  /**
   * Update enrollment progress (advance day / week)
   */
  static async updateEnrollmentProgress(
    userId: string,
    programId: string,
    currentWeek: number,
    currentDay: number
  ) {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      include: {
        program: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    const isComplete =
      currentWeek > enrollment.program.durationWeeks ||
      (currentWeek === enrollment.program.durationWeeks &&
        currentDay > enrollment.program.daysPerWeek);

    const updated = await prisma.programEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentWeek,
        currentDay,
        status: isComplete ? 'COMPLETED' : 'ACTIVE',
        completedAt: isComplete ? new Date() : null,
      },
    });

    if (isComplete) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'PROGRAM_UPDATE',
          title: `🎉 Program Completed: ${enrollment.program.title}!`,
          message: `Congratulations! You have completed the entire ${enrollment.program.durationWeeks}-week program!`,
          metadata: { programId },
        },
      });
    }

    return updated;
  }

  /**
   * Drop/unenroll from program
   */
  static async unenrollUser(userId: string, programId: string) {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    await prisma.programEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'DROPPED',
      },
    });

    return { message: 'Successfully unenrolled from program' };
  }

  /**
   * Get user's enrollments
   */
  static async getUserEnrollments(userId: string) {
    return prisma.programEnrollment.findMany({
      where: { userId },
      include: {
        program: {
          include: {
            _count: {
              select: { weeks: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

import { prisma } from '../config/database';
import { calculateCurrentStreak, calculateLongestStreak } from '../utils/calculations';

export class DashboardService {
  /**
   * Get comprehensive dashboard summary for a user
   */
  static async getDashboardSummary(userId: string) {
    const now = new Date();

    // 1. User Profile & Preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    // 2. Active Session (if any)
    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });

    // 3. Completed Workouts History for Stats
    const completedSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        startedAt: true,
        durationSeconds: true,
        totalVolumeKg: true,
        totalCalories: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    const totalWorkouts = completedSessions.length;
    const totalVolumeKg = completedSessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
    const totalDurationMinutes = completedSessions.reduce(
      (acc, s) => acc + Math.round(s.durationSeconds / 60),
      0
    );
    const totalCalories = completedSessions.reduce((acc, s) => acc + s.totalCalories, 0);

    const workoutDates = completedSessions.map((s) => s.startedAt);
    const currentStreak = calculateCurrentStreak(workoutDates);
    const longestStreak = calculateLongestStreak(workoutDates);

    // 4. This Week's Workouts
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const workoutsThisWeek = completedSessions.filter(
      (s) => new Date(s.startedAt) >= startOfWeek
    ).length;

    const preferredDaysCount = user?.profile?.preferredWorkoutDays?.length || 3;

    // 5. Recent Workouts (last 4)
    const recentSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
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
                weightKg: true,
                reps: true,
                isPersonalRecord: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 4,
    });

    // 6. Recent PRs (last 5)
    const recentPRs = await prisma.personalRecord.findMany({
      where: { userId },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            category: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { achievedAt: 'desc' },
      take: 5,
    });

    // 7. Active Program Enrollment
    const activeEnrollment = await prisma.programEnrollment.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        program: {
          include: {
            weeks: {
              include: {
                days: {
                  include: {
                    exercises: {
                      include: {
                        exercise: true,
                      },
                    },
                  },
                },
              },
              orderBy: { weekNumber: 'asc' },
            },
          },
        },
      },
    });

    // 8. Latest Body Measurement
    const latestMeasurement = await prisma.progressMeasurement.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return {
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.profile?.name,
        avatarUrl: user?.profile?.avatarUrl,
        primaryGoal: user?.profile?.primaryGoal,
        fitnessLevel: user?.profile?.fitnessLevel,
      },
      stats: {
        currentStreak,
        longestStreak,
        totalWorkouts,
        totalVolumeKg: Math.round(totalVolumeKg),
        totalDurationMinutes,
        totalCalories,
        workoutsThisWeek,
        weeklyGoalTarget: preferredDaysCount,
      },
      activeSession,
      recentSessions,
      recentPRs,
      activeEnrollment: activeEnrollment
        ? {
            id: activeEnrollment.id,
            programId: activeEnrollment.programId,
            programTitle: activeEnrollment.program.title,
            currentWeek: activeEnrollment.currentWeek,
            currentDay: activeEnrollment.currentDay,
            totalWeeks: activeEnrollment.program.durationWeeks,
            daysPerWeek: activeEnrollment.program.daysPerWeek,
            startDate: activeEnrollment.startDate,
          }
        : null,
      latestMeasurement,
    };
  }
}

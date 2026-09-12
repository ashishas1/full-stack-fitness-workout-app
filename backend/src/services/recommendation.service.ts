import { prisma } from '../config/database';
import { ExerciseCategory, FitnessGoal, FitnessLevel } from '@prisma/client';

export class RecommendationService {
  /**
   * Generate tailored exercise and workout recommendations for a user
   */
  static async getRecommendations(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const profile = user?.profile;
    const userGoal = profile?.primaryGoal || FitnessGoal.BUILD_MUSCLE;
    const userLevel = profile?.fitnessLevel || FitnessLevel.BEGINNER;
    const availableEquipment = profile?.availableEquipment || [];

    // 1. Calculate muscle groups trained in the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentSessionExercises = await prisma.workoutSessionExercise.findMany({
      where: {
        session: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: twoWeeksAgo },
        },
      },
      include: {
        exercise: {
          select: { category: true },
        },
        sets: {
          where: { isCompleted: true },
        },
      },
    });

    const trainedCategorySets: Record<string, number> = {};
    for (const se of recentSessionExercises) {
      const cat = se.exercise.category;
      trainedCategorySets[cat] = (trainedCategorySets[cat] || 0) + se.sets.length;
    }

    // All major muscle categories
    const majorCategories: ExerciseCategory[] = [
      ExerciseCategory.CHEST,
      ExerciseCategory.BACK,
      ExerciseCategory.SHOULDERS,
      ExerciseCategory.BICEPS,
      ExerciseCategory.TRICEPS,
      ExerciseCategory.QUADS,
      ExerciseCategory.HAMSTRINGS,
      ExerciseCategory.GLUTES,
      ExerciseCategory.ABS,
    ];

    // Find categories with 0 or least sets
    const underworkedCategories = majorCategories
      .map((cat) => ({
        category: cat,
        sets: trainedCategorySets[cat] || 0,
      }))
      .sort((a, b) => a.sets - b.sets)
      .slice(0, 3)
      .map((item) => item.category);

    // 2. Recommend exercises for underworked categories matching user's equipment
    const equipmentFilter =
      availableEquipment.length > 0 ? { in: availableEquipment } : undefined;

    const underworkedExercises = await prisma.exercise.findMany({
      where: {
        category: { in: underworkedCategories },
        isCustom: false,
        ...(equipmentFilter ? { equipment: equipmentFilter } : {}),
      },
      take: 6,
    });

    // 3. Goal-based recommendations
    // Map goals to recommended categories/difficulties
    const goalExercises = await prisma.exercise.findMany({
      where: {
        difficulty: userLevel,
        isCustom: false,
        ...(equipmentFilter ? { equipment: equipmentFilter } : {}),
      },
      take: 6,
    });

    // 4. Recommend workout templates
    const recommendedTemplates = await prisma.workoutTemplate.findMany({
      where: {
        isPublic: true,
      },
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                equipment: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { favoritedBy: true, sessions: true },
        },
      },
      orderBy: { sessions: { _count: 'desc' } },
      take: 3,
    });

    return {
      userGoal,
      userLevel,
      underworkedCategories,
      recommendations: {
        underworkedMuscleExercises: underworkedExercises,
        goalBasedExercises: goalExercises,
        featuredTemplates: recommendedTemplates,
      },
    };
  }
}

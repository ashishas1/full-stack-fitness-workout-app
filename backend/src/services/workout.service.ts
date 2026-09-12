import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { CreateWorkoutTemplateInput, UpdateWorkoutTemplateInput } from '../validators';

export class WorkoutService {
  /**
   * Create a workout template with exercises
   */
  static async createTemplate(userId: string, input: CreateWorkoutTemplateInput) {
    const { exercises, ...templateData } = input;

    // Verify all exercises exist
    if (exercises && exercises.length > 0) {
      const exerciseIds = exercises.map((e) => e.exerciseId);
      const existingExercises = await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true },
      });

      if (existingExercises.length !== exerciseIds.length) {
        throw new BadRequestError('One or more selected exercises do not exist');
      }
    }

    const template = await prisma.workoutTemplate.create({
      data: {
        ...templateData,
        userId,
        exercises: exercises
          ? {
              create: exercises.map((item, index) => ({
                exerciseId: item.exerciseId,
                orderIndex: item.orderIndex ?? index,
                targetSets: item.targetSets ?? 3,
                targetReps: item.targetReps ?? '10',
                targetRpe: item.targetRpe,
                restSeconds: item.restSeconds ?? 60,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return template;
  }

  /**
   * Get user templates and optionally public templates
   */
  static async getTemplates(
    userId: string,
    options: {
      includePublic?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { includePublic = true, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = includePublic
      ? {
          OR: [{ userId }, { isPublic: true }],
        }
      : { userId };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { workoutType: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.workoutTemplate.findMany({
        where,
        include: {
          exercises: {
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
            },
            orderBy: { orderIndex: 'asc' },
          },
          user: {
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
              favoritedBy: true,
              sessions: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workoutTemplate.count({ where }),
    ]);

    // Check which ones are favorited by this user
    const favoriteIds = new Set(
      (
        await prisma.favoriteWorkout.findMany({
          where: { userId },
          select: { templateId: true },
        })
      ).map((f) => f.templateId)
    );

    const data = templates.map((t) => ({
      ...t,
      isFavorited: favoriteIds.has(t.id),
      isOwner: t.userId === userId,
    }));

    return {
      templates: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single template by ID
   */
  static async getTemplateById(templateId: string, userId: string) {
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        user: {
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
            favoritedBy: true,
            sessions: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Workout template not found');
    }

    if (!template.isPublic && template.userId !== userId) {
      throw new ForbiddenError('You do not have access to this private template');
    }

    const isFavorited = !!(await prisma.favoriteWorkout.findUnique({
      where: {
        userId_templateId: {
          userId,
          templateId,
        },
      },
    }));

    return {
      ...template,
      isFavorited,
      isOwner: template.userId === userId,
    };
  }

  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string,
    userId: string,
    input: UpdateWorkoutTemplateInput
  ) {
    const existing = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existing) {
      throw new NotFoundError('Workout template not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You can only modify your own templates');
    }

    const { exercises, ...templateData } = input;

    // Use transaction if updating exercises
    return await prisma.$transaction(async (tx) => {
      if (exercises) {
        // Validate exercise IDs
        const exerciseIds = exercises.map((e) => e.exerciseId);
        const validExercises = await tx.exercise.findMany({
          where: { id: { in: exerciseIds } },
          select: { id: true },
        });

        if (validExercises.length !== exerciseIds.length) {
          throw new BadRequestError('One or more selected exercises do not exist');
        }

        // Delete previous template exercises and re-insert
        await tx.workoutTemplateExercise.deleteMany({
          where: { templateId },
        });

        await tx.workoutTemplateExercise.createMany({
          data: exercises.map((item, index) => ({
            templateId,
            exerciseId: item.exerciseId,
            orderIndex: item.orderIndex ?? index,
            targetSets: item.targetSets ?? 3,
            targetReps: item.targetReps ?? '10',
            targetRpe: item.targetRpe,
            restSeconds: item.restSeconds ?? 60,
            notes: item.notes,
          })),
        });
      }

      const updated = await tx.workoutTemplate.update({
        where: { id: templateId },
        data: templateData,
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      return updated;
    });
  }

  /**
   * Delete template
   */
  static async deleteTemplate(templateId: string, userId: string) {
    const existing = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existing) {
      throw new NotFoundError('Workout template not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You can only delete your own templates');
    }

    await prisma.workoutTemplate.delete({
      where: { id: templateId },
    });

    return { message: 'Workout template deleted successfully' };
  }

  /**
   * Clone a public or existing template to user's library
   */
  static async cloneTemplate(templateId: string, userId: string, customName?: string) {
    const original = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!original) {
      throw new NotFoundError('Workout template not found');
    }

    if (!original.isPublic && original.userId !== userId) {
      throw new ForbiddenError('Cannot clone a private template that is not yours');
    }

    const cloned = await prisma.workoutTemplate.create({
      data: {
        userId,
        name: customName || `${original.name} (Copy)`,
        description: original.description,
        isPublic: false,
        estimatedDuration: original.estimatedDuration,
        workoutType: original.workoutType,
        exercises: {
          create: original.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            targetRpe: e.targetRpe,
            restSeconds: e.restSeconds,
            notes: e.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return cloned;
  }

  /**
   * Toggle favorite workout template
   */
  static async toggleFavorite(userId: string, templateId: string) {
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError('Workout template not found');
    }

    const existing = await prisma.favoriteWorkout.findUnique({
      where: {
        userId_templateId: {
          userId,
          templateId,
        },
      },
    });

    if (existing) {
      await prisma.favoriteWorkout.delete({
        where: { id: existing.id },
      });
      return { favorited: false, message: 'Removed template from favorites' };
    } else {
      await prisma.favoriteWorkout.create({
        data: {
          userId,
          templateId,
        },
      });
      return { favorited: true, message: 'Added template to favorites' };
    }
  }

  /**
   * Get user's favorited templates
   */
  static async getFavorites(userId: string) {
    const favorites = await prisma.favoriteWorkout.findMany({
      where: { userId },
      include: {
        template: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
            user: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      ...f.template,
      isFavorited: true,
      isOwner: f.template.userId === userId,
    }));
  }
}

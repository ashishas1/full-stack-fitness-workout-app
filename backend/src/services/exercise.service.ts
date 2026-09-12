import { prisma } from "../config/database.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import { Role, Prisma } from "@prisma/client";

export class ExerciseService {
  public async getExercises(params: {
    search?: string;
    category?: any;
    equipment?: any;
    difficulty?: any;
    muscle?: string;
    page: number;
    limit: number;
    sort: string;
    order: "asc" | "desc";
    userId?: string;
  }) {
    const { search, category, equipment, difficulty, muscle, page, limit, sort, order, userId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ExerciseWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { primaryMuscle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) where.category = category;
    if (equipment) where.equipment = equipment;
    if (difficulty) where.difficulty = difficulty;
    if (muscle) {
      where.OR = [
        { primaryMuscle: { contains: muscle, mode: "insensitive" } },
        { secondaryMuscles: { has: muscle } },
      ];
    }

    // Include global exercises OR user custom exercises
    where.AND = [
      {
        OR: [
          { isCustom: false },
          ...(userId ? [{ isCustom: true, createdById: userId }] : []),
        ],
      },
    ];

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: userId
          ? {
              favoritedBy: {
                where: { userId },
                select: { id: true },
              },
            }
          : undefined,
      }),
      prisma.exercise.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formatted = exercises.map((ex) => {
      const isFavorited = (ex as any).favoritedBy ? (ex as any).favoritedBy.length > 0 : false;
      const { favoritedBy, ...rest } = ex as any;
      return { ...rest, isFavorited };
    });

    return {
      exercises: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async getExerciseById(id: string, userId?: string) {
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: userId
        ? {
            favoritedBy: {
              where: { userId },
              select: { id: true },
            },
          }
        : undefined,
    });

    if (!exercise) throw new NotFoundError("Exercise not found.");

    const isFavorited = (exercise as any).favoritedBy ? (exercise as any).favoritedBy.length > 0 : false;
    const { favoritedBy, ...rest } = exercise as any;
    return { ...rest, isFavorited };
  }

  public async getExerciseBySlug(slug: string, userId?: string) {
    const exercise = await prisma.exercise.findUnique({
      where: { slug },
      include: userId
        ? {
            favoritedBy: {
              where: { userId },
              select: { id: true },
            },
          }
        : undefined,
    });

    if (!exercise) throw new NotFoundError("Exercise not found.");

    const isFavorited = (exercise as any).favoritedBy ? (exercise as any).favoritedBy.length > 0 : false;
    const { favoritedBy, ...rest } = exercise as any;
    return { ...rest, isFavorited };
  }

  public async createCustomExercise(userId: string, data: any) {
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    const exercise = await prisma.exercise.create({
      data: {
        ...data,
        slug,
        isCustom: true,
        createdById: userId,
      },
    });

    return exercise;
  }

  public async updateExercise(id: string, userId: string, role: Role, data: any) {
    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Exercise not found.");

    // Regular users can only update their custom exercises
    if (role !== Role.ADMIN && (!existing.isCustom || existing.createdById !== userId)) {
      throw new ForbiddenError("You cannot modify standard library exercises or another user's exercise.");
    }

    const updated = await prisma.exercise.update({
      where: { id },
      data,
    });

    return updated;
  }

  public async deleteExercise(id: string, userId: string, role: Role) {
    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Exercise not found.");

    if (role !== Role.ADMIN && (!existing.isCustom || existing.createdById !== userId)) {
      throw new ForbiddenError("You cannot delete standard library exercises or another user's exercise.");
    }

    await prisma.exercise.delete({ where: { id } });
    return { message: "Exercise removed successfully." };
  }

  public async toggleFavorite(userId: string, exerciseId: string) {
    const existing = await prisma.favoriteExercise.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
    });

    if (existing) {
      await prisma.favoriteExercise.delete({
        where: { id: existing.id },
      });
      return { isFavorited: false, message: "Exercise removed from favorites." };
    } else {
      await prisma.favoriteExercise.create({
        data: { userId, exerciseId },
      });
      return { isFavorited: true, message: "Exercise saved to favorites." };
    }
  }

  public async getFavorites(userId: string) {
    const favorites = await prisma.favoriteExercise.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { createdAt: "desc" },
    });

    return favorites.map((f) => ({ ...f.exercise, isFavorited: true }));
  }
}

export const exerciseService = new ExerciseService();

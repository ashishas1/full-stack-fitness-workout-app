import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { LocalStorageService } from './storage.service';
import { PhotoType } from '@prisma/client';
import { RecordMeasurementInput } from '../validators';

const storageService = new LocalStorageService();

export class ProgressService {
  /**
   * Record body measurement
   */
  static async recordMeasurement(userId: string, input: RecordMeasurementInput) {
    const measurement = await prisma.progressMeasurement.create({
      data: {
        userId,
        date: input.date || new Date(),
        weightKg: input.weightKg,
        bodyFatPercentage: input.bodyFatPercentage,
        chestCm: input.chestCm,
        waistCm: input.waistCm,
        armsCm: input.armsCm,
        thighsCm: input.thighsCm,
        hipsCm: input.hipsCm,
        calvesCm: input.calvesCm,
        notes: input.notes,
      },
    });

    // Also update user profile weight if weightKg was provided
    if (input.weightKg) {
      await prisma.userProfile.updateMany({
        where: { userId },
        data: { weightKg: input.weightKg },
      });
    }

    return measurement;
  }

  /**
   * Get body measurements
   */
  static async getMeasurements(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      order?: 'asc' | 'desc';
    } = {}
  ) {
    const { page = 1, limit = 20, order = 'desc' } = options;
    const skip = (page - 1) * limit;

    const [measurements, total] = await Promise.all([
      prisma.progressMeasurement.findMany({
        where: { userId },
        orderBy: { date: order },
        skip,
        take: limit,
      }),
      prisma.progressMeasurement.count({ where: { userId } }),
    ]);

    return {
      measurements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get latest measurement
   */
  static async getLatestMeasurement(userId: string) {
    const latest = await prisma.progressMeasurement.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return latest;
  }

  /**
   * Delete measurement
   */
  static async deleteMeasurement(userId: string, id: string) {
    const existing = await prisma.progressMeasurement.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Measurement record not found');
    }

    await prisma.progressMeasurement.delete({
      where: { id },
    });

    return { message: 'Measurement record deleted successfully' };
  }

  /**
   * Upload progress photo
   */
  static async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
    photoType: PhotoType = 'FRONT',
    notes?: string,
    date?: Date
  ) {
    if (!file) {
      throw new BadRequestError('No image file provided');
    }

    const { url, storageKey } = await storageService.saveMulterFile(file, 'progress-photos');

    const photo = await prisma.progressPhoto.create({
      data: {
        userId,
        photoUrl: url,
        storageKey,
        photoType,
        notes,
        date: date || new Date(),
      },
    });

    return photo;
  }

  /**
   * Get progress photos
   */
  static async getPhotos(userId: string, photoType?: PhotoType) {
    const where: any = { userId };
    if (photoType) where.photoType = photoType;

    return prisma.progressPhoto.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Delete progress photo
   */
  static async deletePhoto(userId: string, id: string) {
    const photo = await prisma.progressPhoto.findUnique({
      where: { id },
    });

    if (!photo || photo.userId !== userId) {
      throw new NotFoundError('Progress photo not found');
    }

    await storageService.deleteFile(photo.storageKey);

    await prisma.progressPhoto.delete({
      where: { id },
    });

    return { message: 'Progress photo deleted successfully' };
  }

  /**
   * Get weight trend history
   */
  static async getWeightHistory(userId: string, days = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const measurements = await prisma.progressMeasurement.findMany({
      where: {
        userId,
        date: { gte: cutoff },
        weightKg: { not: null },
      },
      select: {
        date: true,
        weightKg: true,
        bodyFatPercentage: true,
      },
      orderBy: { date: 'asc' },
    });

    return measurements;
  }

  /**
   * Volume progression aggregated by week
   */
  static async getVolumeProgression(userId: string, weeks = 12) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: { gte: cutoff },
      },
      select: {
        startedAt: true,
        totalVolumeKg: true,
        durationSeconds: true,
      },
      orderBy: { startedAt: 'asc' },
    });

    // Group by week (YYYY-WW)
    const weekMap: Record<string, { week: string; volumeKg: number; workoutsCount: number; durationMinutes: number }> = {};

    for (const s of sessions) {
      const d = new Date(s.startedAt);
      // Simple week key: Year - week number
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      const weekKey = `${d.getFullYear()}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          week: weekKey,
          volumeKg: 0,
          workoutsCount: 0,
          durationMinutes: 0,
        };
      }

      weekMap[weekKey].volumeKg += Math.round(s.totalVolumeKg);
      weekMap[weekKey].workoutsCount += 1;
      weekMap[weekKey].durationMinutes += Math.round(s.durationSeconds / 60);
    }

    return Object.values(weekMap);
  }

  /**
   * Muscle group distribution over the last N days
   */
  static async getMuscleDistribution(userId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const sessionExercises = await prisma.workoutSessionExercise.findMany({
      where: {
        session: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: cutoff },
        },
      },
      include: {
        exercise: {
          select: {
            category: true,
          },
        },
        sets: {
          where: { isCompleted: true },
        },
      },
    });

    const categoryStats: Record<string, { category: string; setsCount: number; volumeKg: number }> = {};

    for (const se of sessionExercises) {
      const cat = se.exercise.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          category: cat,
          setsCount: 0,
          volumeKg: 0,
        };
      }

      for (const st of se.sets) {
        categoryStats[cat].setsCount += 1;
        categoryStats[cat].volumeKg += Math.round(st.weightKg * st.reps);
      }
    }

    return Object.values(categoryStats).sort((a, b) => b.setsCount - a.setsCount);
  }

  /**
   * Workout consistency map (dates of completed workouts)
   */
  static async getWorkoutConsistency(userId: string, days = 365) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: { gte: cutoff },
      },
      select: {
        startedAt: true,
        durationSeconds: true,
        totalVolumeKg: true,
      },
      orderBy: { startedAt: 'asc' },
    });

    const dayMap: Record<string, { date: string; count: number; totalVolumeKg: number }> = {};

    for (const s of sessions) {
      const dateStr = s.startedAt.toISOString().split('T')[0];
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = {
          date: dateStr,
          count: 0,
          totalVolumeKg: 0,
        };
      }
      dayMap[dateStr].count += 1;
      dayMap[dateStr].totalVolumeKg += Math.round(s.totalVolumeKg);
    }

    return Object.values(dayMap);
  }
}

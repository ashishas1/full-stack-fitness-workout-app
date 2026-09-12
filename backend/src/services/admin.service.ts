import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { Role, UserStatus } from '@prisma/client';
import { AuditService } from '../modules/administration/audit.service';

export class AdminService {
  /**
   * Get all users paginated with search and filters
   */
  static async getUsers(options: {
    search?: string;
    role?: Role;
    status?: UserStatus;
    page?: number;
    limit?: number;
  } = {}) {
    const { search, role, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          profile: {
            select: {
              name: true,
              avatarUrl: true,
              primaryGoal: true,
              fitnessLevel: true,
            },
          },
          _count: {
            select: {
              workoutSessions: true,
              workoutTemplates: true,
              memberships: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get deep details of a user
   */
  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            workoutSessions: true,
            workoutTemplates: true,
            personalRecords: true,
            measurements: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user status (e.g. SUSPENDED or ACTIVE) with audit log
   */
  static async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminId?: string,
    requestId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
      },
    });

    if (adminId) {
      await AuditService.log({
        adminId,
        action: 'USER_STATUS_UPDATED',
        resourceType: 'User',
        resourceId: userId,
        beforeState: { status: user.status },
        afterState: { status },
        requestId,
      });
    }

    return updated;
  }

  /**
   * Update user role (USER, TRAINER, STAFF, ADMIN, SUPER_ADMIN) with audit log
   */
  static async updateUserRole(
    userId: string,
    role: Role,
    adminId?: string,
    requestId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (adminId) {
      await AuditService.log({
        adminId,
        action: 'USER_ROLE_UPDATED',
        resourceType: 'User',
        resourceId: userId,
        beforeState: { role: user.role },
        afterState: { role },
        requestId,
      });
    }

    return updated;
  }

  /**
   * Get all platform payments (for finance/audit)
   */
  static async getPayments(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true } },
            },
          },
          order: {
            include: { plan: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count(),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get platform-wide overview statistics (Workouts, Users, Commerce & Revenue)
   */
  static async getPlatformStats() {
    const [
      totalUsers,
      totalActiveUsers,
      totalSessions,
      totalExercises,
      totalTemplates,
      totalPRs,
      volumeAggregate,
      totalMemberships,
      totalActiveMemberships,
      revenueAggregate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.workoutSession.count({ where: { status: 'COMPLETED' } }),
      prisma.exercise.count(),
      prisma.workoutTemplate.count(),
      prisma.personalRecord.count(),
      prisma.workoutSession.aggregate({
        where: { status: 'COMPLETED' },
        _sum: {
          totalVolumeKg: true,
          durationSeconds: true,
        },
      }),
      prisma.membership.count(),
      prisma.membership.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    // Recent 5 registered users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      overview: {
        totalUsers,
        totalActiveUsers,
        totalWorkoutsCompleted: totalSessions,
        totalExercises,
        totalTemplates,
        totalPRsAchieved: totalPRs,
        totalVolumeLiftedKg: Math.round(volumeAggregate._sum.totalVolumeKg || 0),
        totalWorkoutHours: Math.round((volumeAggregate._sum.durationSeconds || 0) / 3600),
        commerce: {
          totalMemberships,
          totalActiveMemberships,
          totalRevenueINR: Math.round(revenueAggregate._sum.amount || 0),
        },
      },
      recentUsers,
    };
  }
}

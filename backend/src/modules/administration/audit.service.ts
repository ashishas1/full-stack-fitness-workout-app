import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export interface CreateAuditLogInput {
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class AuditService {
  /**
   * Append-only audit record creation
   */
  static async log(input: CreateAuditLogInput) {
    try {
      const record = await prisma.adminAuditLog.create({
        data: {
          adminId: input.adminId,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          beforeState: input.beforeState ? JSON.parse(JSON.stringify(input.beforeState)) : undefined,
          afterState: input.afterState ? JSON.parse(JSON.stringify(input.afterState)) : undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          requestId: input.requestId,
        },
      });

      logger.info(`Audit Log Created: [${input.action}] on ${input.resourceType} ${input.resourceId}`, {
        adminId: input.adminId,
        requestId: input.requestId,
      });

      return record;
    } catch (error) {
      logger.error('Failed to create audit log record', { error, input });
      // Never crash critical request due to audit logging failure
      return null;
    }
  }

  /**
   * Query audit logs with pagination and filters
   */
  static async getAuditLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    adminId?: string;
  } = {}) {
    const { page = 1, limit = 20, action, resourceType, adminId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (adminId) where.adminId = adminId;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

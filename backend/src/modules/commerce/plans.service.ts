import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class PlansService {
  /**
   * Get public active plans sorted by sortOrder
   */
  static async getActivePlans() {
    return prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get all plans (admin)
   */
  static async getAllPlans() {
    return prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get single plan by slug or ID
   */
  static async getPlanBySlug(slug: string) {
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        OR: [{ slug: slug.toLowerCase() }, { id: slug }],
      },
    });

    if (!plan) {
      throw new NotFoundError(`Membership plan '${slug}' not found.`);
    }

    return plan;
  }

  /**
   * Create plan (admin)
   */
  static async createPlan(data: {
    name: string;
    slug: string;
    description: string;
    price: number;
    currency?: string;
    durationDays?: number | null;
    features?: string[];
    popular?: boolean;
    badge?: string | null;
    tagline?: string | null;
    sortOrder?: number;
  }) {
    return prisma.membershipPlan.create({
      data: {
        ...data,
        slug: data.slug.toLowerCase(),
        currency: data.currency || 'INR',
        features: data.features || [],
      },
    });
  }

  /**
   * Update plan (admin)
   */
  static async updatePlan(id: string, data: any) {
    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Membership plan not found.');
    }

    return prisma.membershipPlan.update({
      where: { id },
      data,
    });
  }
}

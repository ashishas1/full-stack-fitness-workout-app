import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class InvoicesService {
  /**
   * Get all invoices for a user
   */
  static async getUserInvoices(userId: string) {
    return prisma.invoice.findMany({
      where: { userId },
      include: {
        payment: {
          select: {
            paymentMethod: true,
            providerPaymentId: true,
            paidAt: true,
          },
        },
        membership: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  /**
   * Get single invoice by ID
   */
  static async getInvoiceById(invoiceId: string, userId: string, isAdmin: boolean = false) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
        payment: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    if (!isAdmin && invoice.userId !== userId) {
      throw new ForbiddenError('You do not have access to this invoice.');
    }

    return invoice;
  }
}

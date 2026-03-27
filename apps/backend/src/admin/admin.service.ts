import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from '../events/order.gateway';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private orderGateway: OrderGateway,
  ) {}

  async getAllOrders(
    page = 1,
    limit = 20,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          address: true,
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              specialInstructions: true,
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(orderId: string, _adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            specialInstructions: true,
            menuItem: true,
          },
        },
        payment: true,
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    adminId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: previousStatus,
        newStatus: status as any,
        changedById: adminId,
      },
    });

    this.orderGateway.emitOrderStatusUpdate(
      orderId,
      status,
      previousStatus,
    );

    return updatedOrder;
  }

  async getOrderHistory(orderId: string) {
    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      include: {
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });

    return history;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: string;
    addressId: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    items: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: number;
      customizationPrice: number;
      specialInstructions?: string;
      selectedOptions?: Array<{ groupId: string; optionId: string; name: string; priceModifier: number }>;
    }>;
  }) {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        addressId: data.addressId,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        status: 'RECEIVED',
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            customizationPrice: item.customizationPrice,
            specialInstructions: item.specialInstructions,
            selectedOptions: item.selectedOptions || [],
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        address: true,
        user: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        address: true,
        user: true,
        payment: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        address: true,
        user: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        address: true,
        user: true,
      },
    });
  }

  async addPayment(orderId: string, razorpayPaymentId: string, amount: number, status: string) {
    return this.prisma.payment.create({
      data: {
        orderId,
        razorpayPaymentId,
        amount,
        status: status as any,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
            address: true,
            user: true,
          },
        },
      },
    });
  }
}
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from '../events/order.gateway';
import { OrderStatus } from '@prisma/client';

export interface OrderItemData {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizationPrice: number;
  specialInstructions?: string;
  selectedOptions?: Array<{ groupId: string; optionId: string; name: string; priceModifier: number }>;
}

export interface CreateOrderData {
  userId: string;
  addressId: string;
  specialInstructions?: string;
  items: OrderItemData[];
}

@Injectable()
export class OrderService {
  private readonly TAX_RATE = 0.18;
  private readonly PREPARATION_TIME_PER_ITEM = 10; // minutes
  private readonly PAYMENT_TIMEOUT_MINUTES = 15; // Pending orders expire after 15 minutes

  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private prisma: PrismaService,
    private orderGateway: OrderGateway,
  ) {}

  async createOrder(data: CreateOrderData) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Items array cannot be empty');
    }

    if (!data.addressId) {
      throw new BadRequestException('Address is required');
    }

    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity + item.customizationPrice * item.quantity;
      return sum + itemTotal;
    }, 0);

    const taxAmount = subtotal * this.TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    const address = await this.prisma.address.findFirst({
      where: {
        id: data.addressId,
        userId: data.userId,
      },
    });

    if (!address) {
      throw new BadRequestException('Invalid address');
    }

    return await this.prisma.$transaction(async (tx) => {
      const menuItemPrices = new Map<string, { price: number; name: string; isLimited: boolean; stockQuantity: number; isAvailable: boolean }>();
      
      for (const item of data.items) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: item.menuItemId },
        });
        
        if (!menuItem) {
          throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
        }

        menuItemPrices.set(item.menuItemId, {
          price: Number(menuItem.price),
          name: menuItem.name,
          isLimited: menuItem.isLimited,
          stockQuantity: menuItem.stockQuantity,
          isAvailable: menuItem.isAvailable,
        });

        if (!menuItem.isAvailable) {
          throw new ConflictException(`${menuItem.name} is not available`);
        }

        if (menuItem.isLimited) {
          const result = await tx.menuItem.updateMany({
            where: { 
              id: item.menuItemId,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });
          
          if (result.count === 0) {
            throw new ConflictException(`Insufficient stock for ${menuItem.name}. Available: ${menuItem.stockQuantity}`);
          }
        }
      }

      const recalculatedSubtotal = data.items.reduce((sum, item) => {
        const menuItemPrice = menuItemPrices.get(item.menuItemId);
        const unitPrice = menuItemPrice ? menuItemPrice.price : item.unitPrice;
        const itemTotal = unitPrice * item.quantity + item.customizationPrice * item.quantity;
        return sum + itemTotal;
      }, 0);

      const recalculatedTaxAmount = recalculatedSubtotal * this.TAX_RATE;
      const recalculatedTotalAmount = recalculatedSubtotal + recalculatedTaxAmount;

      const order = await tx.order.create({
        data: {
          userId: data.userId,
          addressId: data.addressId,
          status: 'PENDING',
          subtotal: Math.round(recalculatedSubtotal * 100) / 100,
          taxAmount: Math.round(recalculatedTaxAmount * 100) / 100,
          totalAmount: Math.round(recalculatedTotalAmount * 100) / 100,
          specialInstructions: data.specialInstructions,
          items: {
            create: data.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: menuItemPrices.get(item.menuItemId)?.price ?? item.unitPrice,
              customizationPrice: item.customizationPrice,
              specialInstructions: item.specialInstructions,
              selectedOptions: item.selectedOptions || [],
            })),
          },
        },
        include: {
          items: true,
        },
      });

      this.orderGateway.emitNewOrder(order);

      return order;
    });
  }

  async getOrder(id: string) {
    return this.orderRepository.findById(id);
  }

  async getUserOrders(userId: string) {
    await this.cancelExpiredPendingOrders();
    return this.orderRepository.findByUserId(userId);
  }

  private async cancelExpiredPendingOrders() {
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - this.PAYMENT_TIMEOUT_MINUTES);

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: timeoutDate,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    for (const order of expiredOrders) {
      try {
        await this.updateOrderStatus(order.id, 'PAYMENT_FAILED');
      } catch (error) {
        console.error(`Failed to cancel expired order ${order.id}:`, error);
      }
    }
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const previousStatus = order.status;

    if (status === 'CANCELLED' || status === 'PAYMENT_FAILED') {
      for (const item of order.items) {
        if (item.menuItem && item.menuItem.isLimited) {
          await this.prisma.menuItem.update({
            where: { id: item.menuItemId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    }

    const updatedOrder = await this.orderRepository.updateStatus(id, status);

    const estimatedTime = this.calculateEstimatedTime(updatedOrder);

    this.orderGateway.emitOrderStatusUpdate(
      id,
      status,
      previousStatus,
      estimatedTime,
    );

    return updatedOrder;
  }

  private calculateEstimatedTime(order: any): number {
    if (!order.items || order.items.length === 0) {
      return this.PREPARATION_TIME_PER_ITEM;
    }

    const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    return Math.max(this.PREPARATION_TIME_PER_ITEM, totalItems * this.PREPARATION_TIME_PER_ITEM);
  }

  async recordPayment(orderId: string, razorpayPaymentId: string, amount: number, status: string) {
    return this.orderRepository.addPayment(orderId, razorpayPaymentId, amount, status);
  }

  async releaseStock(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return;

    for (const item of order.items) {
      if (item.menuItem && item.menuItem.isLimited) {
        await this.prisma.menuItem.updateMany({
          where: { id: item.menuItemId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }
    }
  }
}
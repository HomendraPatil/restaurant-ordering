import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from '../events/order.gateway';

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

    // Validate addressId is provided
    if (!data.addressId) {
      throw new BadRequestException('Address is required');
    }

    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity + item.customizationPrice * item.quantity;
      return sum + itemTotal;
    }, 0);

    const taxAmount = subtotal * this.TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: {
        id: data.addressId,
        userId: data.userId,
      },
    });

    if (!address) {
      throw new BadRequestException('Invalid address');
    }

    // Verify all menu items exist
    for (const item of data.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
      }
    }

    const order = await this.orderRepository.create({
      userId: data.userId,
      addressId: data.addressId,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      specialInstructions: data.specialInstructions,
      items: data.items,
    });

    this.orderGateway.emitNewOrder(order);

    return order;
  }

  async getOrder(id: string) {
    return this.orderRepository.findById(id);
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const previousStatus = order.status;
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
}
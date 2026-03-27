import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private prisma: PrismaService,
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
      items: data.items,
    });

    return order;
  }

  async getOrder(id: string) {
    return this.orderRepository.findById(id);
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.orderRepository.updateStatus(id, status);
  }

  async recordPayment(orderId: string, razorpayPaymentId: string, amount: number, status: string) {
    return this.orderRepository.addPayment(orderId, razorpayPaymentId, amount, status);
  }
}
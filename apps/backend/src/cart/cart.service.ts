import { Injectable } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { PrismaService } from '../prisma/prisma.service';

export interface CartItemData {
  items: unknown[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

@Injectable()
export class CartService {
  private readonly TAX_RATE = 0.18;

  constructor(
    private cartRepository: CartRepository,
    private prisma: PrismaService,
  ) {}

  async getCart(userId?: string, sessionId?: string): Promise<CartItemData> {
    const items = userId
      ? await this.cartRepository.findCartByUserId(userId)
      : await this.cartRepository.findCartBySessionId(sessionId!);

    const subtotal = items.reduce((sum, item) => {
      const itemTotal = Number(item.unitPrice) * item.quantity + Number(item.customizationPrice) * item.quantity;
      return sum + itemTotal;
    }, 0);

    const taxAmount = subtotal * this.TAX_RATE;
    const total = subtotal + taxAmount;

    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  async addItem(data: {
    userId?: string;
    sessionId?: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    customizationPrice?: number;
    specialInstructions?: string;
  }) {
    return this.cartRepository.addItem(data);
  }

  async updateItem(id: string, data: {
    quantity?: number;
    specialInstructions?: string;
  }) {
    return this.cartRepository.updateItem(id, data);
  }

  async removeItem(id: string) {
    return this.cartRepository.removeItem(id);
  }

  async clearCart(userId?: string, sessionId?: string) {
    return this.cartRepository.clearCart(userId, sessionId);
  }

  async mergeCart(userId: string, sessionId: string) {
    const sessionCart = await this.cartRepository.findCartBySessionId(sessionId);
    
    for (const item of sessionCart) {
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          userId,
          menuItemId: item.menuItemId,
        },
      });

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            userId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            customizationPrice: item.customizationPrice,
            specialInstructions: item.specialInstructions,
          },
        });
      }
    }

    await this.cartRepository.clearCart(undefined, sessionId);
    return this.getCart(userId);
  }
}

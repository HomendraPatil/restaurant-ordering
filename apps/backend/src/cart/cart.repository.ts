import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async findCartByUserId(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        menuItem: {
          include: {
            category: true,
            customizations: {
              include: {
                options: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        customizations: {
          include: {
            option: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCartBySessionId(sessionId: string) {
    return this.prisma.cartItem.findMany({
      where: { sessionId },
      include: {
        menuItem: {
          include: {
            category: true,
            customizations: {
              include: {
                options: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        customizations: {
          include: {
            option: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(data: {
    userId?: string;
    sessionId?: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    customizationPrice?: number;
    specialInstructions?: string;
    selectedOptions?: string[];
  }) {
    const whereClause = data.userId
      ? { userId: data.userId, menuItemId: data.menuItemId }
      : { sessionId: data.sessionId, menuItemId: data.menuItemId };

    const existingItem = await this.prisma.cartItem.findFirst({
      where: whereClause,
    });

    if (existingItem) {
      // Check if customizations are the same - if different, create new item
      if (data.selectedOptions && data.selectedOptions.length > 0) {
        const existingCustomizations = await this.prisma.cartItemCustomization.findMany({
          where: { cartItemId: existingItem.id },
          select: { optionId: true },
        });
        
        const existingOptionIds = existingCustomizations.map(c => c.optionId).sort();
        const newOptionIds = [...data.selectedOptions].sort();
        
        const hasSameCustomizations = JSON.stringify(existingOptionIds) === JSON.stringify(newOptionIds);
        
        if (!hasSameCustomizations) {
          // Different customizations - create new cart item (don't merge)
          const newItem = await this.prisma.cartItem.create({
            data: {
              userId: data.userId,
              sessionId: data.sessionId,
              menuItemId: data.menuItemId,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              customizationPrice: data.customizationPrice || 0,
              specialInstructions: data.specialInstructions,
            },
            include: {
              menuItem: {
                include: {
                  category: true,
                  customizations: {
                    include: { options: true },
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
              customizations: {
                include: { option: true },
              },
            },
          });

          if (data.selectedOptions?.length) {
            for (const optionId of data.selectedOptions) {
              await this.prisma.cartItemCustomization.create({
                data: { cartItemId: newItem.id, optionId },
              });
            }
          }

          return newItem;
        }
      }

      // Same customizations - merge them
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          customizationPrice: Number(existingItem.customizationPrice) + (data.customizationPrice || 0),
        },
        include: {
          menuItem: {
            include: {
              category: true,
              customizations: {
                include: { options: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          customizations: {
            include: { option: true },
          },
        },
      });
    }

    const newItem = await this.prisma.cartItem.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        customizationPrice: data.customizationPrice || 0,
        specialInstructions: data.specialInstructions,
      },
      include: {
        menuItem: {
          include: {
            category: true,
            customizations: {
              include: {
                options: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        customizations: {
          include: {
            option: true,
          },
        },
      },
    });

    if (data.selectedOptions && data.selectedOptions.length > 0) {
      for (const optionId of data.selectedOptions) {
        await this.prisma.cartItemCustomization.create({
          data: {
            cartItemId: newItem.id,
            optionId,
          },
        });
      }
    }

    return this.prisma.cartItem.findUnique({
      where: { id: newItem.id },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
        customizations: {
          include: {
            option: true,
          },
        },
      },
    });
  }

  async updateItem(id: string, data: {
    quantity?: number;
    specialInstructions?: string;
  }) {
    return this.prisma.cartItem.update({
      where: { id },
      data: {
        quantity: data.quantity,
        specialInstructions: data.specialInstructions,
      },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
        customizations: {
          include: {
            option: true,
          },
        },
      },
    });
  }

  async removeItem(id: string) {
    return this.prisma.cartItem.delete({
      where: { id },
    });
  }

  async clearCart(userId?: string, sessionId?: string) {
    return this.prisma.cartItem.deleteMany({
      where: {
        ...(userId && { userId }),
        ...(sessionId && { sessionId }),
      },
    });
  }
}

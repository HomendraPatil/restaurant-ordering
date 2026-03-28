import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CustomizationType } from '@prisma/client';

export interface MenuFilters {
  categoryId?: string;
  search?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

@Injectable()
export class MenuRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: MenuFilters, pagination?: PaginationParams) {
    const where: Prisma.MenuItemWhereInput = {
      isAvailable: true,
      deletedAt: null,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.isVegetarian) {
      where.isVegetarian = true;
    }

    if (filters?.isVegan) {
      where.isVegan = true;
    }

    if (filters?.isGlutenFree) {
      where.isGlutenFree = true;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters?.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 12;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          customizations: {
            where: {
              options: {
                some: {},
              },
            },
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllForAdmin(pagination?: PaginationParams) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;
    const skip = (page - 1) * limit;

    const where: Prisma.MenuItemWhereInput = {
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          customizations: {
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        customizations: {
          where: {
            options: {
              some: {},
            },
          },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.menuItem.findUnique({
      where: { slug },
      include: {
        category: true,
        customizations: {
          where: {
            options: {
              some: {},
            },
          },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(data: Prisma.MenuItemCreateInput) {
    return this.prisma.menuItem.create({ data });
  }

  async update(id: string, data: Prisma.MenuItemUpdateInput) {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getCustomizationGroupById(id: string) {
    return this.prisma.itemCustomizationGroup.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async createCustomizationGroup(data: {
    menuItemId: string;
    name: string;
    type: CustomizationType | string;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
  }) {
    let typeValue: CustomizationType;
    if (typeof data.type === 'string') {
      typeValue = data.type === 'SINGLE' ? 'SIZE' : data.type === 'MULTIPLE' ? 'ADDON' : data.type as CustomizationType;
    } else {
      typeValue = data.type;
    }
    return this.prisma.itemCustomizationGroup.create({
      data: {
        menuItemId: data.menuItemId,
        name: data.name,
        type: typeValue,
        isRequired: data.isRequired ?? false,
        minSelections: data.minSelections ?? 0,
        maxSelections: data.maxSelections ?? 1,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        options: true,
      },
    });
  }

  async updateCustomizationGroup(id: string, data: {
    name?: string;
    type?: CustomizationType | string;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
  }) {
    const updateData: any = { ...data };
    if (data.type && typeof data.type === 'string') {
      updateData.type = data.type === 'SINGLE' ? 'SIZE' : data.type === 'MULTIPLE' ? 'ADDON' : data.type as CustomizationType;
    }
    return this.prisma.itemCustomizationGroup.update({
      where: { id },
      data: updateData,
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async deleteCustomizationGroup(id: string) {
    return this.prisma.itemCustomizationGroup.delete({
      where: { id },
    });
  }

  async getCustomizationOptionById(id: string) {
    return this.prisma.customizationOption.findUnique({
      where: { id },
    });
  }

  async createCustomizationOption(data: {
    groupId: string;
    name: string;
    priceModifier?: number;
    isDefault?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.customizationOption.create({
      data: {
        groupId: data.groupId,
        name: data.name,
        priceModifier: data.priceModifier ?? 0,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateCustomizationOption(id: string, data: {
    name?: string;
    priceModifier?: number;
    isDefault?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.customizationOption.update({
      where: { id },
      data,
    });
  }

  async deleteCustomizationOption(id: string) {
    return this.prisma.customizationOption.delete({
      where: { id },
    });
  }
}

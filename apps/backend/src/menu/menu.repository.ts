import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
}

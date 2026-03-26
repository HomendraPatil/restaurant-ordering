import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CategoryPaginationParams {
  page?: number;
  limit?: number;
}

@Injectable()
export class CategoryRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination?: CategoryPaginationParams) {
    const where = {
      isActive: true,
      deletedAt: null,
    };

    if (!pagination?.page && !pagination?.limit) {
      return this.prisma.category.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
      });
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 12;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where }),
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
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: {
            isAvailable: true,
            deletedAt: null,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        menuItems: {
          where: {
            isAvailable: true,
            deletedAt: null,
          },
        },
      },
    });
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

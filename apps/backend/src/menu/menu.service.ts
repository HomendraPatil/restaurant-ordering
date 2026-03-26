import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuRepository, MenuFilters, PaginationParams } from './menu.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private menuRepository: MenuRepository) {}

  async findAll(filters?: MenuFilters, pagination?: PaginationParams) {
    return this.menuRepository.findAll(filters, pagination);
  }

  async findById(id: string) {
    const item = await this.menuRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }

  async findBySlug(slug: string) {
    const item = await this.menuRepository.findBySlug(slug);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }

  async create(data: Prisma.MenuItemCreateInput) {
    return this.menuRepository.create(data);
  }

  async update(id: string, data: Prisma.MenuItemUpdateInput) {
    await this.findById(id);
    return this.menuRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.menuRepository.softDelete(id);
  }
}

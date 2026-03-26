import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async findAll() {
    return this.categoryRepository.findAll();
  }

  async findById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.categoryRepository.create(data);
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    await this.findById(id);
    return this.categoryRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.categoryRepository.softDelete(id);
  }
}

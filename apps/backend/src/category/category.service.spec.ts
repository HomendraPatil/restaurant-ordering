import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let categoryRepository: { findAll: jest.Mock; findById: jest.Mock; findBySlug: jest.Mock; create: jest.Mock; update: jest.Mock; softDelete: jest.Mock };

  beforeEach(async () => {
    categoryRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CategoryRepository, useValue: categoryRepository },
      ],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);
  });

  describe('findAll', () => {
    it('should return paginated categories when pagination params provided', async () => {
      const paginatedResult = {
        items: [{ id: 'cat-1', name: 'Starters', slug: 'starters', description: null, imageUrl: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, _count: { menuItems: 5 } }],
        total: 8,
        page: 1,
        limit: 4,
        totalPages: 2,
      };
      categoryRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await categoryService.findAll({ page: 1, limit: 4 }) as typeof paginatedResult;

      expect(result).toEqual(paginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(8);
      expect(result.totalPages).toBe(2);
    });

    it('should return paginated result when no pagination params provided', async () => {
      const paginatedResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      };
      categoryRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await categoryService.findAll();

      expect(result).toEqual(paginatedResult);
    });

    it('should pass pagination params to repository', async () => {
      const paginatedResult = {
        items: [{ id: 'cat-1', name: 'Starters', slug: 'starters', description: null, imageUrl: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, _count: { menuItems: 5 } }],
        total: 8,
        page: 2,
        limit: 4,
        totalPages: 2,
      };
      categoryRepository.findAll.mockResolvedValue(paginatedResult);

      await categoryService.findAll({ page: 2, limit: 4 });

      expect(categoryRepository.findAll).toHaveBeenCalledWith({ page: 2, limit: 4 });
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      const mockCategory = { id: 'cat-1', name: 'Starters', slug: 'starters', description: null, imageUrl: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, menuItems: [] };
      categoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await categoryService.findById('cat-1');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return category when found', async () => {
      const mockCategory = { id: 'cat-1', slug: 'starters', name: 'Starters', description: null, imageUrl: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, menuItems: [] };
      categoryRepository.findBySlug.mockResolvedValue(mockCategory);

      const result = await categoryService.findBySlug('starters');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(categoryService.findBySlug('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategory = { id: 'new-cat', name: 'Beverages', slug: 'beverages', description: null, imageUrl: null, sortOrder: 5, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      categoryRepository.create.mockResolvedValue(newCategory);

      const result = await categoryService.create({ name: 'Beverages', slug: 'beverages' });

      expect(result.name).toBe('Beverages');
    });
  });

  describe('update', () => {
    it('should update category when found', async () => {
      const existingCategory = { id: 'cat-1', name: 'Starters', slug: 'starters', description: null, imageUrl: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, menuItems: [] };
      const updatedCategory = { ...existingCategory, name: 'Appetizers' };
      categoryRepository.findById.mockResolvedValue(existingCategory);
      categoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await categoryService.update('cat-1', { name: 'Appetizers' });

      expect(result.name).toBe('Appetizers');
    });

    it('should throw NotFoundException when updating nonexistent category', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.update('nonexistent-id', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete category when found', async () => {
      const existingCategory = { id: 'cat-1', name: 'Starters', slug: 'starters', description: null, imageUrl: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, menuItems: [] };
      const deletedCategory = { ...existingCategory, deletedAt: new Date() };
      categoryRepository.findById.mockResolvedValue(existingCategory);
      categoryRepository.softDelete.mockResolvedValue(deletedCategory);

      const result = await categoryService.delete('cat-1');

      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when deleting nonexistent category', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.delete('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});

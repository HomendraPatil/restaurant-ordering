import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';

describe('MenuService', () => {
  let menuService: MenuService;
  let menuRepository: { findAll: jest.Mock; findById: jest.Mock; findBySlug: jest.Mock; create: jest.Mock; update: jest.Mock; softDelete: jest.Mock };

  beforeEach(async () => {
    menuRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: MenuRepository, useValue: menuRepository },
      ],
    }).compile();

    menuService = module.get<MenuService>(MenuService);
  });

  describe('findAll', () => {
    it('should return paginated menu items when pagination params provided', async () => {
      const paginatedResult = {
        items: [],
        total: 81,
        page: 1,
        limit: 12,
        totalPages: 7,
      };
      menuRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await menuService.findAll({}, { page: 1, limit: 12 });

      expect(result).toEqual(paginatedResult);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(81);
      expect(result.totalPages).toBe(7);
    });

    it('should return paginated result when no pagination params provided', async () => {
      const paginatedResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      };
      menuRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await menuService.findAll();

      expect(result).toEqual(paginatedResult);
    });

    it('should pass filters and pagination to repository', async () => {
      const paginatedResult = {
        items: [],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      };
      menuRepository.findAll.mockResolvedValue(paginatedResult);

      await menuService.findAll({ categoryId: 'cat-1', search: 'Paneer' }, { page: 1, limit: 12 });

      expect(menuRepository.findAll).toHaveBeenCalledWith(
        { categoryId: 'cat-1', search: 'Paneer' },
        { page: 1, limit: 12 }
      );
    });

    it('should filter by dietary preferences', async () => {
      const paginatedResult = {
        items: [],
        total: 5,
        page: 1,
        limit: 12,
        totalPages: 1,
      };
      menuRepository.findAll.mockResolvedValue(paginatedResult);

      await menuService.findAll(
        { isVegetarian: true, isGlutenFree: true },
        { page: 1, limit: 12 }
      );

      expect(menuRepository.findAll).toHaveBeenCalledWith(
        { isVegetarian: true, isGlutenFree: true },
        { page: 1, limit: 12 }
      );
    });
  });

  describe('findById', () => {
    it('should return menu item when found', async () => {
      const mockItem = { id: 'item-1', name: 'Test Item', slug: 'test-item', description: null, price: {} as unknown, categoryId: 'cat-1', imageUrl: null, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, preparationTime: null, stockQuantity: null, isLimited: false, category: { id: 'cat-1', name: 'Test', slug: 'test' }, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, customizations: [] };
      menuRepository.findById.mockResolvedValue(mockItem);

      const result = await menuService.findById('item-1');

      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when menu item not found', async () => {
      menuRepository.findById.mockResolvedValue(null);

      await expect(menuService.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return menu item when found', async () => {
      const mockItem = { id: 'item-1', slug: 'test-item', name: 'Test Item', description: null, price: {} as unknown, categoryId: 'cat-1', imageUrl: null, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, preparationTime: null, stockQuantity: null, isLimited: false, category: { id: 'cat-1', name: 'Test', slug: 'test' }, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, customizations: [] };
      menuRepository.findBySlug.mockResolvedValue(mockItem);

      const result = await menuService.findBySlug('test-item');

      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when menu item not found', async () => {
      menuRepository.findBySlug.mockResolvedValue(null);

      await expect(menuService.findBySlug('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new menu item', async () => {
      const newItem = { id: 'new-item', name: 'New Item', slug: 'new-item', description: null, price: {} as unknown, categoryId: 'cat-1', imageUrl: null, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, preparationTime: null, stockQuantity: null, isLimited: false, category: { id: 'cat-1', name: 'Test', slug: 'test' }, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, customizations: [] };
      menuRepository.create.mockResolvedValue(newItem);

      const result = await menuService.create({ name: 'New Item', slug: 'new-item', price: 10, category: { connect: { id: 'cat-1' } } });

      expect(result).toEqual(newItem);
    });
  });

  describe('update', () => {
    it('should update menu item when found', async () => {
      const existingItem = { id: 'item-1', name: 'Old Name', slug: 'old-name', description: null, price: {} as unknown, categoryId: 'cat-1', imageUrl: null, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, preparationTime: null, stockQuantity: null, isLimited: false, category: { id: 'cat-1', name: 'Test', slug: 'test' }, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, customizations: [] };
      const updatedItem = { ...existingItem, name: 'Updated Name' };
      menuRepository.findById.mockResolvedValue(existingItem);
      menuRepository.update.mockResolvedValue(updatedItem);

      const result = await menuService.update('item-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when updating nonexistent item', async () => {
      menuRepository.findById.mockResolvedValue(null);

      await expect(menuService.update('nonexistent-id', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete menu item when found', async () => {
      const existingItem = { id: 'item-1', name: 'Item', slug: 'item', description: null, price: {} as unknown, categoryId: 'cat-1', imageUrl: null, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, preparationTime: null, stockQuantity: null, isLimited: false, category: { id: 'cat-1', name: 'Test', slug: 'test' }, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, customizations: [] };
      const deletedItem = { ...existingItem, deletedAt: new Date() };
      menuRepository.findById.mockResolvedValue(existingItem);
      menuRepository.softDelete.mockResolvedValue(deletedItem);

      const result = await menuService.delete('item-1');

      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when deleting nonexistent item', async () => {
      menuRepository.findById.mockResolvedValue(null);

      await expect(menuService.delete('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});

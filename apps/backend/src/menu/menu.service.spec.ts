import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';

describe('MenuService', () => {
  let menuService: MenuService;
  let menuRepository: { 
    findAll: jest.Mock; 
    findAllForAdmin: jest.Mock;
    findById: jest.Mock; 
    findBySlug: jest.Mock; 
    create: jest.Mock; 
    update: jest.Mock; 
    softDelete: jest.Mock;
    getCustomizationGroupById: jest.Mock;
    createCustomizationGroup: jest.Mock;
    updateCustomizationGroup: jest.Mock;
    deleteCustomizationGroup: jest.Mock;
    getCustomizationOptionById: jest.Mock;
    createCustomizationOption: jest.Mock;
    updateCustomizationOption: jest.Mock;
    deleteCustomizationOption: jest.Mock;
  };

  beforeEach(async () => {
    menuRepository = {
      findAll: jest.fn(),
      findAllForAdmin: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getCustomizationGroupById: jest.fn(),
      createCustomizationGroup: jest.fn(),
      updateCustomizationGroup: jest.fn(),
      deleteCustomizationGroup: jest.fn(),
      getCustomizationOptionById: jest.fn(),
      createCustomizationOption: jest.fn(),
      updateCustomizationOption: jest.fn(),
      deleteCustomizationOption: jest.fn(),
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

  describe('findAllForAdmin', () => {
    it('should return all menu items including unavailable for admin', async () => {
      const adminResult = {
        items: [
          { id: 'item-1', name: 'Item 1', isAvailable: false, customizations: [] },
          { id: 'item-2', name: 'Item 2', isAvailable: true, customizations: [] },
        ],
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      };
      menuRepository.findAllForAdmin.mockResolvedValue(adminResult);

      const result = await menuService.findAllForAdmin({ page: 1, limit: 100 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('createCustomizationGroup', () => {
    it('should create a customization group for a menu item', async () => {
      const menuItem = { id: 'menu-item-1', name: 'Pizza', customizations: [] };
      menuRepository.findById.mockResolvedValue(menuItem);
      const createdGroup = { 
        id: 'group-1', 
        menuItemId: 'menu-item-1', 
        name: 'Size', 
        type: 'SIZE' as const,
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: 0,
        options: []
      };
      menuRepository.createCustomizationGroup.mockResolvedValue(createdGroup);

      const result = await menuService.createCustomizationGroup({
        menuItemId: 'menu-item-1',
        name: 'Size',
        type: 'SIZE',
        isRequired: false,
      });

      expect(result.name).toBe('Size');
      expect(result.type).toBe('SINGLE');
    });

    it('should map SINGLE type to SIZE when creating group', async () => {
      const menuItem = { id: 'menu-item-1', name: 'Pizza', customizations: [] };
      menuRepository.findById.mockResolvedValue(menuItem);
      menuRepository.createCustomizationGroup.mockResolvedValue({ 
        id: 'group-1', 
        menuItemId: 'menu-item-1', 
        name: 'Size', 
        type: 'SIZE' as const,
        options: []
      });

      const result = await menuService.createCustomizationGroup({
        menuItemId: 'menu-item-1',
        name: 'Size',
        type: 'SINGLE',
      });

      expect(menuRepository.createCustomizationGroup).toHaveBeenCalled();
      expect(result.type).toBe('SINGLE');
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      menuRepository.findById.mockResolvedValue(null);

      await expect(menuService.createCustomizationGroup({
        menuItemId: 'nonexistent-id',
        name: 'Size',
        type: 'SIZE',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCustomizationGroup', () => {
    it('should update a customization group', async () => {
      const existingGroup = { id: 'group-1', name: 'Size', type: 'SIZE' };
      menuRepository.getCustomizationGroupById.mockResolvedValue(existingGroup);
      const updatedGroup = { ...existingGroup, name: 'Updated Size', type: 'ADDON' };
      menuRepository.updateCustomizationGroup.mockResolvedValue(updatedGroup);

      const result = await menuService.updateCustomizationGroup('group-1', { name: 'Updated Size' });

      expect(result.name).toBe('Updated Size');
    });

    it('should throw NotFoundException when group does not exist', async () => {
      menuRepository.getCustomizationGroupById.mockResolvedValue(null);

      await expect(menuService.updateCustomizationGroup('nonexistent-id', { name: 'Test' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCustomizationGroup', () => {
    it('should delete a customization group', async () => {
      const existingGroup = { id: 'group-1', name: 'Size', type: 'SIZE' };
      menuRepository.getCustomizationGroupById.mockResolvedValue(existingGroup);
      menuRepository.deleteCustomizationGroup.mockResolvedValue(existingGroup);

      const result = await menuService.deleteCustomizationGroup('group-1');

      expect(result).toEqual(existingGroup);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      menuRepository.getCustomizationGroupById.mockResolvedValue(null);

      await expect(menuService.deleteCustomizationGroup('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('createCustomizationOption', () => {
    it('should create a customization option', async () => {
      const group = { id: 'group-1', name: 'Size', options: [] };
      menuRepository.getCustomizationGroupById.mockResolvedValue(group);
      const createdOption = { 
        id: 'option-1', 
        groupId: 'group-1', 
        name: 'Large', 
        priceModifier: 100,
        isDefault: false,
        sortOrder: 0
      };
      menuRepository.createCustomizationOption.mockResolvedValue(createdOption);

      const result = await menuService.createCustomizationOption({
        groupId: 'group-1',
        name: 'Large',
        priceModifier: 100,
      });

      expect(result.name).toBe('Large');
      expect(result.priceModifier).toBe(100);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      menuRepository.getCustomizationGroupById.mockResolvedValue(null);

      await expect(menuService.createCustomizationOption({
        groupId: 'nonexistent-id',
        name: 'Large',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCustomizationOption', () => {
    it('should update a customization option', async () => {
      const existingOption = { id: 'option-1', name: 'Large', priceModifier: 0 };
      menuRepository.getCustomizationOptionById.mockResolvedValue(existingOption);
      const updatedOption = { ...existingOption, name: 'Extra Large', priceModifier: 50 };
      menuRepository.updateCustomizationOption.mockResolvedValue(updatedOption);

      const result = await menuService.updateCustomizationOption('option-1', { name: 'Extra Large', priceModifier: 50 });

      expect(result.name).toBe('Extra Large');
      expect(result.priceModifier).toBe(50);
    });

    it('should throw NotFoundException when option does not exist', async () => {
      menuRepository.getCustomizationOptionById.mockResolvedValue(null);

      await expect(menuService.updateCustomizationOption('nonexistent-id', { name: 'Test' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCustomizationOption', () => {
    it('should delete a customization option', async () => {
      const existingOption = { id: 'option-1', name: 'Large' };
      menuRepository.getCustomizationOptionById.mockResolvedValue(existingOption);
      menuRepository.deleteCustomizationOption.mockResolvedValue(existingOption);

      const result = await menuService.deleteCustomizationOption('option-1');

      expect(result).toEqual(existingOption);
    });

    it('should throw NotFoundException when option does not exist', async () => {
      menuRepository.getCustomizationOptionById.mockResolvedValue(null);

      await expect(menuService.deleteCustomizationOption('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});

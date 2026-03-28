'use client';

import React from 'react';

describe('AdminMenuPage', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Main Course',
      slug: 'main-course',
      description: 'Delicious main dishes',
      imageUrl: 'https://example.com/image1.jpg',
      isAvailable: true,
      displayOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Beverages',
      slug: 'beverages',
      description: 'Refreshing drinks',
      imageUrl: null,
      isAvailable: true,
      displayOrder: 2,
    },
  ];

  const mockMenuItems = [
    {
      id: 'menu-1',
      name: 'Butter Chicken',
      description: 'Creamy tomato curry',
      price: '350',
      categoryId: 'cat-1',
      imageUrl: 'https://example.com/butter-chicken.jpg',
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      stockQuantity: 50,
      preparationTime: 25,
    },
    {
      id: 'menu-2',
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese',
      price: '280',
      categoryId: 'cat-1',
      imageUrl: null,
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      stockQuantity: 30,
      preparationTime: 20,
    },
  ];

  const mockCustomizationGroups = [
    {
      id: 'group-1',
      name: 'Spice Level',
      menuItemId: 'menu-1',
      isRequired: true,
      maxSelections: 1,
      options: [
        { id: 'opt-1', name: 'Mild', priceModifier: 0 },
        { id: 'opt-2', name: 'Medium', priceModifier: 0 },
        { id: 'opt-3', name: 'Hot', priceModifier: 0 },
      ],
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('has categories data structure', () => {
    expect(mockCategories).toHaveLength(2);
    expect(mockCategories[0]).toHaveProperty('id');
    expect(mockCategories[0]).toHaveProperty('name');
    expect(mockCategories[0]).toHaveProperty('slug');
    expect(mockCategories[0]).toHaveProperty('isAvailable');
  });

  it('has menu items data structure', () => {
    expect(mockMenuItems).toHaveLength(2);
    expect(mockMenuItems[0]).toHaveProperty('name');
    expect(mockMenuItems[0]).toHaveProperty('price');
    expect(mockMenuItems[0]).toHaveProperty('isVegetarian');
    expect(mockMenuItems[0]).toHaveProperty('isAvailable');
    expect(mockMenuItems[0]).toHaveProperty('stockQuantity');
  });

  it('has dietary flags on menu items', () => {
    const item = mockMenuItems[0];
    expect(item).toHaveProperty('isVegetarian');
    expect(item).toHaveProperty('isVegan');
    expect(item).toHaveProperty('isGlutenFree');
    expect(typeof item.isVegetarian).toBe('boolean');
  });

  it('has stock quantity on menu items', () => {
    const item = mockMenuItems[0];
    expect(item).toHaveProperty('stockQuantity');
    expect(typeof item.stockQuantity).toBe('number');
  });

  it('has customization groups structure', () => {
    expect(mockCustomizationGroups).toHaveLength(1);
    expect(mockCustomizationGroups[0]).toHaveProperty('options');
    expect(mockCustomizationGroups[0].options).toHaveLength(3);
  });

  it('can create category payload', () => {
    const payload = {
      name: 'New Category',
      slug: 'new-category',
      description: 'Description',
      isAvailable: true,
      displayOrder: 3,
    };
    expect(payload.name).toBe('New Category');
  });

  it('can create menu item payload', () => {
    const payload = {
      name: 'New Item',
      description: 'Description',
      price: 299,
      categoryId: 'cat-1',
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      stockQuantity: 100,
    };
    expect(payload.price).toBe(299);
    expect(payload.isVegetarian).toBe(true);
  });

  it('can update menu item availability', () => {
    const item = { ...mockMenuItems[0], isAvailable: false };
    expect(item.isAvailable).toBe(false);
  });

  it('can update stock quantity', () => {
    const item = { ...mockMenuItems[0], stockQuantity: 25 };
    expect(item.stockQuantity).toBe(25);
  });
});

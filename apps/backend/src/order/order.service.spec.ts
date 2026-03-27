import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from '../events/order.gateway';

describe('OrderService', () => {
  let orderService: OrderService;
  let orderRepository: { create: jest.Mock; findById: jest.Mock; findByUserId: jest.Mock; updateStatus: jest.Mock; addPayment: jest.Mock };
  let prisma: { address: { findFirst: jest.Mock }; menuItem: { findUnique: jest.Mock } };
  let orderGateway: { emitOrderStatusUpdate: jest.Mock };

  beforeEach(async () => {
    orderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateStatus: jest.fn(),
      addPayment: jest.fn(),
    };
    
    prisma = {
      address: {
        findFirst: jest.fn(),
      },
      menuItem: {
        findUnique: jest.fn(),
      },
    };

    orderGateway = {
      emitOrderStatusUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: orderRepository },
        { provide: CartRepository, useValue: {} },
        { provide: PrismaService, useValue: prisma },
        { provide: OrderGateway, useValue: orderGateway },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
  });

  describe('createOrder', () => {
    const mockUserId = 'user-123';
    const mockAddressId = 'address-123';
    const mockMenuItemId = 'menu-item-123';

    it('should create an order with correct totals', async () => {
      const orderItems = [
        {
          menuItemId: mockMenuItemId,
          quantity: 2,
          unitPrice: 100,
          customizationPrice: 20,
          selectedOptions: [],
        },
      ];

      prisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      prisma.menuItem.findUnique.mockResolvedValue({ id: mockMenuItemId, price: '100' });
      
      const mockOrder = {
        id: 'order-123',
        userId: mockUserId,
        addressId: mockAddressId,
        subtotal: 240, // (100 + 20) * 2
        taxAmount: 43.2, // 240 * 0.18
        totalAmount: 283.2,
        items: [],
        address: {},
        user: {},
      };
      
      orderRepository.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder({
        userId: mockUserId,
        addressId: mockAddressId,
        items: orderItems,
      });

      expect(result.subtotal).toBe(240);
      expect(result.taxAmount).toBe(43.2);
      expect(result.totalAmount).toBe(283.2);
      expect(orderRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid address', async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        orderService.createOrder({
          userId: mockUserId,
          addressId: 'invalid-address',
          items: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create order with PENDING status by default', async () => {
      const orderItems = [
        {
          menuItemId: mockMenuItemId,
          quantity: 1,
          unitPrice: 100,
          customizationPrice: 0,
          selectedOptions: [],
        },
      ];

      prisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      prisma.menuItem.findUnique.mockResolvedValue({ id: mockMenuItemId, price: '100' });
      
      const mockOrder = {
        id: 'order-123',
        userId: mockUserId,
        addressId: mockAddressId,
        status: 'PENDING',
        subtotal: 100,
        taxAmount: 18,
        totalAmount: 118,
        items: [],
        address: {},
        user: {},
      };
      
      orderRepository.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder({
        userId: mockUserId,
        addressId: mockAddressId,
        items: orderItems,
      });

      expect(result.status).toBe('PENDING');
    });

    it('should throw BadRequestException for non-existent menu item', async () => {
      prisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      prisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        orderService.createOrder({
          userId: mockUserId,
          addressId: mockAddressId,
          items: [{ menuItemId: 'invalid-item', quantity: 1, unitPrice: 100, customizationPrice: 0, selectedOptions: [] }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOrder', () => {
    it('should return order by id', async () => {
      const mockOrder = { id: 'order-123', userId: 'user-123' };
      orderRepository.findById.mockResolvedValue(mockOrder);

      const result = await orderService.getOrder('order-123');

      expect(result).toEqual(mockOrder);
    });
  });

  describe('getUserOrders', () => {
    it('should return orders for a user', async () => {
      const mockOrders = [{ id: 'order-1' }, { id: 'order-2' }];
      orderRepository.findByUserId.mockResolvedValue(mockOrders);

      const result = await orderService.getUserOrders('user-123');

      expect(result).toEqual(mockOrders);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = { id: 'order-123', status: 'RECEIVED', items: [] };
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });

      const result = await orderService.updateOrderStatus('order-123', 'PREPARING');

      expect(result.status).toBe('PREPARING');
      expect(orderGateway.emitOrderStatusUpdate).toHaveBeenCalled();
    });
  });
});
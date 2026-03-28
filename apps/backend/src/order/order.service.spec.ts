import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from '../events/order.gateway';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockPrisma: any;
  let orderRepository: any;
  let orderGateway: any;

  beforeEach(async () => {
    mockPrisma = {
      address: {
        findFirst: jest.fn(),
      },
      menuItem: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      order: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    orderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateStatus: jest.fn(),
      addPayment: jest.fn(),
    };

    orderGateway = {
      emitOrderStatusUpdate: jest.fn(),
      emitNewOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: orderRepository },
        { provide: CartRepository, useValue: {} },
        { provide: PrismaService, useValue: mockPrisma },
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

      mockPrisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrisma.menuItem.findUnique.mockResolvedValue({ 
        id: mockMenuItemId, 
        price: '100',
        name: 'Test Item',
        isLimited: false,
        isAvailable: true,
        stockQuantity: 10,
      });
      
      const mockOrder = {
        id: 'order-123',
        userId: mockUserId,
        addressId: mockAddressId,
        status: 'PENDING',
        subtotal: 240,
        taxAmount: 43.2,
        totalAmount: 283.2,
        items: [],
        address: {},
        user: {},
      };
      
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder({
        userId: mockUserId,
        addressId: mockAddressId,
        items: orderItems,
      });

      expect(result.subtotal).toBe(240);
      expect(result.taxAmount).toBe(43.2);
      expect(result.totalAmount).toBe(283.2);
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid address', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(null);

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

      mockPrisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrisma.menuItem.findUnique.mockResolvedValue({ 
        id: mockMenuItemId, 
        price: '100',
        name: 'Test Item',
        isLimited: false,
        isAvailable: true,
      });
      
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
      
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder({
        userId: mockUserId,
        addressId: mockAddressId,
        items: orderItems,
      });

      expect(result.status).toBe('PENDING');
    });

    it('should throw BadRequestException for non-existent menu item', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        orderService.createOrder({
          userId: mockUserId,
          addressId: mockAddressId,
          items: [{ menuItemId: 'invalid-item', quantity: 1, unitPrice: 100, customizationPrice: 0, selectedOptions: [] }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when item is not available', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrisma.menuItem.findUnique.mockResolvedValue({ 
        id: mockMenuItemId, 
        price: '100',
        name: 'Unavailable Item',
        isLimited: false,
        isAvailable: false,
      });

      await expect(
        orderService.createOrder({
          userId: mockUserId,
          addressId: mockAddressId,
          items: [{ menuItemId: mockMenuItemId, quantity: 1, unitPrice: 100, customizationPrice: 0, selectedOptions: [] }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when stock is insufficient', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrisma.menuItem.findUnique.mockResolvedValue({ 
        id: mockMenuItemId, 
        price: '100',
        name: 'Limited Item',
        isLimited: true,
        isAvailable: true,
        stockQuantity: 2,
      });
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        orderService.createOrder({
          userId: mockUserId,
          addressId: mockAddressId,
          items: [{ menuItemId: mockMenuItemId, quantity: 5, unitPrice: 100, customizationPrice: 0, selectedOptions: [] }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should deduct stock for limited items', async () => {
      const orderItems = [
        {
          menuItemId: mockMenuItemId,
          quantity: 2,
          unitPrice: 100,
          customizationPrice: 0,
          selectedOptions: [],
        },
      ];

      mockPrisma.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrisma.menuItem.findUnique.mockResolvedValue({ 
        id: mockMenuItemId, 
        price: '100',
        name: 'Limited Item',
        isLimited: true,
        isAvailable: true,
        stockQuantity: 10,
      });
      mockPrisma.menuItem.updateMany.mockResolvedValue({ count: 1 });

      const mockOrder = {
        id: 'order-123',
        userId: mockUserId,
        addressId: mockAddressId,
        status: 'PENDING',
        subtotal: 200,
        taxAmount: 36,
        totalAmount: 236,
        items: [],
      };
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      await orderService.createOrder({
        userId: mockUserId,
        addressId: mockAddressId,
        items: orderItems,
      });

      expect(mockPrisma.menuItem.updateMany).toHaveBeenCalledWith({
        where: { id: mockMenuItemId, stockQuantity: { gte: 2 } },
        data: { stockQuantity: { decrement: 2 } },
      });
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
    const mockMenuItemId = 'menu-item-123';

    it('should update order status', async () => {
      const mockOrder = { id: 'order-123', status: 'RECEIVED', items: [] };
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'PREPARING' });

      const result = await orderService.updateOrderStatus('order-123', 'PREPARING');

      expect(result.status).toBe('PREPARING');
      expect(orderGateway.emitOrderStatusUpdate).toHaveBeenCalled();
    });

    it('should restore stock when order is cancelled', async () => {
      const mockOrder = { 
        id: 'order-123', 
        status: 'PENDING', 
        items: [
          { 
            menuItemId: mockMenuItemId, 
            quantity: 2,
            menuItem: { id: mockMenuItemId, name: 'Test Item', isLimited: true }
          }
        ] 
      };
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });
      mockPrisma.menuItem.update.mockResolvedValue({ id: mockMenuItemId, stockQuantity: 10 });

      await orderService.updateOrderStatus('order-123', 'CANCELLED');

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: mockMenuItemId },
        data: { stockQuantity: { increment: 2 } },
      });
    });

    it('should restore stock when payment fails', async () => {
      const mockMenuItemId = 'menu-item-123';
      const mockOrder = { 
        id: 'order-123', 
        status: 'PENDING', 
        items: [
          { 
            menuItemId: mockMenuItemId, 
            quantity: 3,
            menuItem: { id: mockMenuItemId, name: 'Test Item', isLimited: true }
          }
        ] 
      };
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'PAYMENT_FAILED' });
      mockPrisma.menuItem.update.mockResolvedValue({ id: mockMenuItemId, stockQuantity: 10 });

      await orderService.updateOrderStatus('order-123', 'PAYMENT_FAILED');

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: mockMenuItemId },
        data: { stockQuantity: { increment: 3 } },
      });
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from '../events/order.gateway';

describe('AdminService', () => {
  let adminService: AdminService;
  let prisma: {
    order: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    orderStatusHistory: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let orderGateway: { emitOrderStatusUpdate: jest.Mock };

  const mockOrders = [
    {
      id: 'order-1',
      status: 'RECEIVED',
      subtotal: '500',
      taxAmount: '90',
      totalAmount: '590',
      createdAt: new Date(),
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com', phone: '1234567890' },
      address: { addressLine: '123 Main St', city: 'Mumbai', pincode: '400001' },
      items: [
        { id: 'item-1', quantity: 2, unitPrice: '250', specialInstructions: null, menuItem: { id: 'menu-1', name: 'Burger', imageUrl: null } },
      ],
      payment: { status: 'PAID' },
    },
    {
      id: 'order-2',
      status: 'PREPARING',
      subtotal: '300',
      taxAmount: '54',
      totalAmount: '354',
      createdAt: new Date(),
      user: { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321' },
      address: { addressLine: '456 Oak Ave', city: 'Delhi', pincode: '110001' },
      items: [
        { id: 'item-2', quantity: 1, unitPrice: '300', specialInstructions: 'No onions', menuItem: { id: 'menu-2', name: 'Pizza', imageUrl: null } },
      ],
      payment: { status: 'PAID' },
    },
  ];

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    orderGateway = {
      emitOrderStatusUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderGateway, useValue: orderGateway },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
  });

  describe('getAllOrders', () => {
    it('should return paginated orders', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(2);

      const result = await adminService.getAllOrders(1, 10);

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalled();
      expect(prisma.order.count).toHaveBeenCalled();
    });

    it('should filter orders by status', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrders[1]]);
      prisma.order.count.mockResolvedValue(1);

      const result = await adminService.getAllOrders(1, 10, 'PREPARING');

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe('PREPARING');
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PREPARING' }),
        })
      );
    });

    it('should filter orders by date range', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrders[0]]);
      prisma.order.count.mockResolvedValue(1);

      await adminService.getAllOrders(1, 10, undefined, '2024-01-01', '2024-12-31');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            }),
          }),
        })
      );
    });

    it('should return empty array when no orders exist', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      const result = await adminService.getAllOrders(1, 10);

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrders[0],
        statusHistory: [],
      });

      const result = await adminService.getOrderById('order-1', 'admin-1');

      expect(result.id).toBe('order-1');
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(adminService.getOrderById('non-existent', 'admin-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and emit WebSocket event', async () => {
      const order = { ...mockOrders[0], status: 'RECEIVED' };
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'PREPARING' });
      prisma.orderStatusHistory.create.mockResolvedValue({});

      const result = await adminService.updateOrderStatus('order-1', 'PREPARING', 'admin-1');

      expect(result.status).toBe('PREPARING');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'PREPARING' },
        include: expect.any(Object),
      });
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: 'order-1',
          oldStatus: 'RECEIVED',
          newStatus: 'PREPARING',
          changedById: 'admin-1',
        },
      });
      expect(orderGateway.emitOrderStatusUpdate).toHaveBeenCalledWith(
        'order-1',
        'PREPARING',
        'RECEIVED'
      );
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        adminService.updateOrderStatus('non-existent', 'PREPARING', 'admin-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should update status to CANCELLED', async () => {
      const order = { ...mockOrders[0], status: 'RECEIVED' };
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'CANCELLED' });
      prisma.orderStatusHistory.create.mockResolvedValue({});

      const result = await adminService.updateOrderStatus('order-1', 'CANCELLED', 'admin-1');

      expect(result.status).toBe('CANCELLED');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED' },
        include: expect.any(Object),
      });
    });
  });

  describe('getOrderHistory', () => {
    it('should return order status history', async () => {
      const history = [
        {
          id: 'history-1',
          orderId: 'order-1',
          oldStatus: 'PENDING',
          newStatus: 'RECEIVED',
          changedAt: new Date(),
          changedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com' },
        },
        {
          id: 'history-2',
          orderId: 'order-1',
          oldStatus: 'RECEIVED',
          newStatus: 'PREPARING',
          changedAt: new Date(),
          changedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com' },
        },
      ];
      prisma.orderStatusHistory.findMany.mockResolvedValue(history);

      const result = await adminService.getOrderHistory('order-1');

      expect(result).toHaveLength(2);
      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith({
        where: { orderId: 'order-1' },
        include: expect.any(Object),
        orderBy: { changedAt: 'desc' },
      });
    });

    it('should return empty array when no history', async () => {
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      const result = await adminService.getOrderHistory('order-1');

      expect(result).toHaveLength(0);
    });
  });
});

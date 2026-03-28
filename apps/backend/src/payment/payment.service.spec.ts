import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { OrderRepository } from '../order/order.repository';
import { OrderService } from '../order/order.service';
import { OrderGateway } from '../events/order.gateway';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let orderRepository: { addPayment: jest.Mock; findById: jest.Mock; updateStatus: jest.Mock };
  let orderService: { releaseStock: jest.Mock };
  let configService: { get: jest.Mock };
  let orderGateway: { emitOrderStatusUpdate: jest.Mock };
  let prisma: { payment: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    orderRepository = {
      addPayment: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    orderService = {
      releaseStock: jest.fn(),
    };
    
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          'RAZORPAY_KEY_ID': 'test_key_id',
          'RAZORPAY_KEY_SECRET': 'test_key_secret',
        };
        return config[key];
      }),
    };

    orderGateway = {
      emitOrderStatusUpdate: jest.fn(),
    };

    prisma = {
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: OrderRepository, useValue: orderRepository },
        { provide: OrderService, useValue: orderService },
        { provide: ConfigService, useValue: configService },
        { provide: OrderGateway, useValue: orderGateway },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
  });

  describe('createRazorpayOrder', () => {
    it('should create Razorpay order with correct amount', async () => {
      const mockRazorpayOrder = {
        id: 'order_123',
        amount: 10000, // in paise
        currency: 'INR',
        status: 'created',
      };
      
      // Mock the Razorpay constructor
      const MockRazorpay = jest.fn().mockImplementation(() => ({
        orders: {
          create: jest.fn().mockResolvedValue(mockRazorpayOrder),
        },
      }));
      
      // Replace the Razorpay import
      (paymentService as any).razorpay = new MockRazorpay({
        key_id: 'test_key_id',
        key_secret: 'test_key_secret',
      });

      const result = await paymentService.createRazorpayOrder({
        orderId: 'order-123',
        amount: 10000, // ₹100 = 10000 paise
        currency: 'INR',
      });

      expect(result.id).toBe('order_123');
      expect(result.amount).toBe(10000);
    });
  });

  describe('verifyPayment', () => {
    it('should return true for valid signature', async () => {
      // Compute the correct signature using the same secret
      const body = 'order_123|pay_123';
      const correctSignature = crypto
        .createHmac('sha256', 'test_key_secret')
        .update(body)
        .digest('hex');

      const result = await paymentService.verifyPayment({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: correctSignature,
      });

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      const result = await paymentService.verifyPayment({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'invalid_signature',
      });

      expect(result).toBe(false);
    });
  });

  describe('recordPaymentSuccess', () => {
    it('should record payment and update order status', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'PENDING',
        totalAmount: 100,
      };
      
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue({ id: 'payment-123' });
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'RECEIVED' });

      const result = await paymentService.recordPaymentSuccess({
        orderId: 'order-123',
        razorpayPaymentId: 'pay_123',
        amount: 100,
      });

      expect(orderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'RECEIVED');
    });

    it('should throw ConflictException for duplicate payment', async () => {
      orderRepository.addPayment.mockRejectedValue(new ConflictException('Payment already processed'));

      await expect(
        paymentService.recordPaymentSuccess({
          orderId: 'order-123',
          razorpayPaymentId: 'pay_123',
          amount: 100,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('recordPaymentFailure', () => {
    it('should record failed payment and restore stock', async () => {
      orderRepository.addPayment.mockResolvedValue({ id: 'payment-failed' });
      orderRepository.updateStatus.mockResolvedValue({ 
        id: 'order-123', 
        status: 'PAYMENT_FAILED' 
      });
      orderService.releaseStock.mockResolvedValue(undefined);

      const result = await paymentService.recordPaymentFailure('order-123', 'pay_failed_123');

      expect(orderRepository.addPayment).toHaveBeenCalledWith('order-123', 'pay_failed_123', 0, 'FAILED');
      expect(orderService.releaseStock).toHaveBeenCalledWith('order-123');
      expect(orderRepository.updateStatus).toHaveBeenCalledWith('order-123', 'PAYMENT_FAILED');
    });
  });
});
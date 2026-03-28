import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { OrderRepository } from '../order/order.repository';
import { OrderService } from '../order/order.service';
import { OrderGateway } from '../events/order.gateway';
import { PrismaService } from '../prisma/prisma.service';

const Razorpay = require('razorpay');

export interface CreatePaymentParams {
  orderId: string;
  amount: number; // in paise
  currency?: string;
}

export interface VerifyPaymentParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RecordPaymentParams {
  orderId: string;
  razorpayPaymentId: string;
  amount: number;
}

@Injectable()
export class PaymentService {
  private razorpay: InstanceType<typeof Razorpay>;

  constructor(
    private configService: ConfigService,
    private orderRepository: OrderRepository,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private orderGateway: OrderGateway,
    private prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
    });
  }

  async createRazorpayOrder(params: CreatePaymentParams) {
    const options = {
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.orderId,
      notes: {
        orderId: params.orderId,
      },
    };

    const order = await this.razorpay.orders.create(options);
    return order;
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    const body = params.razorpayOrderId + '|' + params.razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET') || '')
      .update(body)
      .digest('hex');

    return expectedSignature === params.razorpaySignature;
  }

  async recordPaymentSuccess(params: RecordPaymentParams) {
    let amount = params.amount;
    let order = null;
    
    if (!amount || amount === 0) {
      order = await this.orderRepository.findById(params.orderId);
      amount = order ? Number(order.totalAmount) : 0;
    }
    
    await this.orderRepository.addPayment(
      params.orderId,
      params.razorpayPaymentId,
      amount,
      'SUCCESS',
    );

    order = order || await this.orderRepository.findById(params.orderId);
    
    if (!order) {
      throw new Error('Order not found after payment');
    }

    const updatedOrder = await this.orderRepository.updateStatus(params.orderId, 'RECEIVED');
    
    this.orderGateway.emitOrderStatusUpdate(params.orderId, 'RECEIVED', 'PENDING');
    
    return updatedOrder;
  }

  async recordPaymentFailure(orderId: string, razorpayPaymentId: string) {
    await this.orderRepository.addPayment(
      orderId,
      razorpayPaymentId,
      0,
      'FAILED',
    );

    await this.orderService.releaseStock(orderId);

    const updatedOrder = await this.orderRepository.updateStatus(orderId, 'PAYMENT_FAILED');
    return updatedOrder;
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET') || '')
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }
}
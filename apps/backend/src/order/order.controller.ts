import { Controller, Get, Post, Body, Param, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards';
import { Public } from '../common/decorators/public.decorator';

class CreateOrderDto {
  addressId: string;
  specialInstructions?: string;
}

class OrderItemDto {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizationPrice: number;
  specialInstructions?: string;
  selectedOptions?: Array<{ groupId: string; optionId: string; name: string; priceModifier: number }>;
}

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createOrder(@Body() dto: CreateOrderDto & { items: OrderItemDto[] }, @Req() req: Request) {
    const userId = (req as any).user.id;

    const { items } = dto as { items: OrderItemDto[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    return this.orderService.createOrder({
      userId,
      addressId: dto.addressId,
      specialInstructions: dto.specialInstructions,
      items,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'List of user orders' })
  async getMyOrders(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.orderService.getUserOrders(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    const order = await this.orderService.getOrder(id);
    
    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }
    
    return order;
  }
}
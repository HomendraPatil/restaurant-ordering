import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { CartService } from './cart.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { IsOptional, IsString } from 'class-validator';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Session ID for guest cart' })
  @ApiResponse({ status: 200, description: 'Cart with items and totals' })
  async getCart(@Headers('x-session-id') sessionId: string, @Req() req: Request) {
    const userId = (req as any).user?.id;
    return this.cartService.getCart(userId, sessionId);
  }

  @Public()
  @Post('items')
  @HttpCode(201)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Session ID for guest cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  async addItem(
    @Body() dto: AddToCartDto,
    @Headers('x-session-id') sessionId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    return this.cartService.addItem({
      userId,
      sessionId,
      menuItemId: dto.menuItemId,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      customizationPrice: dto.customizationPrice,
      specialInstructions: dto.specialInstructions,
      selectedOptions: dto.selectedOptions,
    });
  }

  @Public()
  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  async updateItem(@Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(id, dto);
  }

  @Public()
  @Delete('items/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Cart item removed' })
  async removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Headers('x-session-id') sessionId: string, @Req() req: Request) {
    const userId = (req as any).user?.id;
    return this.cartService.clearCart(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('merge')
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Merge guest cart into user cart' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'Session ID of guest cart to merge' })
  @ApiResponse({ status: 201, description: 'Cart merged successfully' })
  async mergeCart(
    @Headers('x-session-id') sessionId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    return this.cartService.mergeCart(userId, sessionId);
  }
}

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { IsString } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

class UpdateStatusDto {
  @IsString()
  status: string;
}

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('orders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (admin)' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAllOrders(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      startDate,
      endDate,
    );
  }

  @Get('orders/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get order by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string, @Req() req: Request) {
    const adminId = (req as any).user.id;
    return this.adminService.getOrderById(id, adminId);
  }

  @Patch('orders/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user.id;
    return this.adminService.updateOrderStatus(id, dto.status, adminId);
  }

  @Get('orders/:id/history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Order status history' })
  async getOrderHistory(@Param('id') id: string) {
    return this.adminService.getOrderHistory(id);
  }
}
